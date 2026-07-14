import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { findShortestPath, stadiumGraph, findNearestAmenity } from "./src/venueGraph.js";

// Lazy-loaded Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Handle json payload up to 15MB to allow photo submissions
  app.use(express.json({ limit: "15mb" }));

  // In-memory crowd density status
  const crowdStatus: Record<string, "low" | "medium" | "high"> = {
    north: "low",
    south: "low",
    east: "low",
    west: "low"
  };

  // API 1: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Compass26 Stadium Assistant" });
  });

  // API to get crowd status
  app.get("/api/crowd", (req, res) => {
    res.json(crowdStatus);
  });

  // API to update crowd status
  app.post("/api/crowd", (req, res) => {
    const { north, south, east, west } = req.body;
    if (north) crowdStatus.north = north;
    if (south) crowdStatus.south = south;
    if (east) crowdStatus.east = east;
    if (west) crowdStatus.west = west;
    res.json(crowdStatus);
  });

  // API 2: Shortest path routing inside the stadium
  app.post("/api/shortest-path", (req, res) => {
    try {
      const { origin, destination, stepFreeOnly } = req.body;
      if (!origin || !destination) {
        res.status(400).json({ error: "Missing origin or destination fields." });
        return;
      }

      const result = findShortestPath(origin, destination, !!stepFreeOnly, crowdStatus);
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API 3: Get the static stadium graph representation (useful for frontend rendering)
  app.get("/api/venue-graph", (req, res) => {
    res.json(stadiumGraph);
  });

  // Function Declarations for Gemini Function Calling
  const findRouteDeclaration: FunctionDeclaration = {
    name: "find_route",
    description: "Find the shortest route between two locations in the stadium, optionally restricting to step-free only paths.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        origin: {
          type: Type.STRING,
          description: "The starting location node ID (e.g., 'gate_a', 'block_101', 'concession_tacos')."
        },
        destination: {
          type: Type.STRING,
          description: "The ending location node ID (e.g., 'block_105', 'med_east', 'exit_north')."
        },
        step_free_only: {
          type: Type.BOOLEAN,
          description: "Set to true to strictly find only accessible, step-free paths (no stairs or escalators)."
        }
      },
      required: ["origin", "destination"]
    }
  };

  const findNearestDeclaration: FunctionDeclaration = {
    name: "find_nearest",
    description: "Find the nearest amenity of a specified type relative to a starting location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        amenity_type: {
          type: Type.STRING,
          description: "The type of amenity to locate. Must be one of: 'restroom', 'concession', 'medical', 'guest_services', 'gate', 'exit'."
        },
        origin: {
          type: Type.STRING,
          description: "The start node ID (e.g., 'block_101')."
        }
      },
      required: ["amenity_type", "origin"]
    }
  };

  const getAccessibilityInfoDeclaration: FunctionDeclaration = {
    name: "get_accessibility_info",
    description: "Retrieve accessibility (step-free status) details and other helper info for a stadium location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: {
          type: Type.STRING,
          description: "The node ID of the location (e.g., 'block_101', 'restroom_se')."
        }
      },
      required: ["location"]
    }
  };

  const getCrowdStatusDeclaration: FunctionDeclaration = {
    name: "get_crowd_status",
    description: "Get the live crowd density status of a stadium zone ('north', 'south', 'east', 'west') or all zones.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        zone_id: {
          type: Type.STRING,
          description: "Optional. The zone ID ('north', 'south', 'east', 'west'). If not specified, returns all zones."
        }
      }
    }
  };

  // API 4: Multilingual Chat with Gemini 3.5 Flash using Function Calling
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, currentLanguage, accessibilityMode } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid or missing messages array." });
        return;
      }

      // Lazy load Gemini
      let ai;
      try {
        ai = getGeminiClient();
      } catch (keyErr: any) {
        res.status(401).json({
          error: "API key missing",
          message: "Please configure your GEMINI_API_KEY in the Secrets panel."
        });
        return;
      }

      // Grab the latest user message
      const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user");
      if (!lastUserMsg) {
        res.status(400).json({ error: "No user message found in history." });
        return;
      }

      // Construct system instruction based on stadium context and chosen language
      let systemInstruction = `You are 'Compass26', a highly advanced, welcoming AI assistant for the FIFA World Cup Stadium.
Your goal is to guide visitors, support navigation between stadium points, and answer general stadium queries.

Venue Nodes Information:
${JSON.stringify(stadiumGraph.nodes.map(n => ({ id: n.id, name: n.name, type: n.type, step_free: n.step_free })))}

You have access to 4 key tools/functions to query the ground truth stadium graph:
1. find_route(origin, destination, step_free_only): Always use the exact Node IDs (e.g. 'gate_a', 'block_101') as parameters.
2. find_nearest(amenity_type, origin): Finds the closest restroom, concession, first aid medical point, gate, exit, or guest service relative to the user's start location.
3. get_accessibility_info(location): Tells you whether a specific block or facility has stairs or is step-free.
4. get_crowd_status(zone_id): Returns the live crowd density ('low', 'medium', 'high') of a zone.

When the user asks for directions, routes, finding the closest facility, or accessibility help, you MUST call the appropriate function first.
Once you receive the function response, use that ground truth data to explain the step-by-step directions.
Translate the final instructions and respond with clear, reader-friendly step-by-step directions in the same language the user wrote in (requested language: "${currentLanguage || 'auto-detect'}"). If auto-detect, reply in the same language the user speaks.

Instructions:
1. Always be warm, professional, concise, and precise.
2. If the user uploads a photo (e.g. ticket, seat number, signboard, or item), analyze it carefully as a steward of the stadium and guide them accordingly.
3. Keep answers readable with bullet points. Do not mention raw technical identifiers (like 'gate_a' or 'block_101') directly to the user unless translating them to readable names (like 'Gate A' or 'Block 101').
4. Always provide clear, bulleted, step-by-step navigation paths when a route is retrieved from the function.
5. IMPORTANT: If a route shows 'rerouted_around_crowds' as true in the tool response, you MUST clearly mention to the user that you have automatically rerouted them to avoid a crowded zone (e.g., 'avoiding the busy North zone')!`;

      if (accessibilityMode) {
        systemInstruction += `\n\nCRITICAL: ACCESSIBILITY MODE IS ACTIVE. You MUST respond with very short, simple, and direct sentences. Avoid complex vocabulary or long paragraphs. Keep descriptions extremely clean and brief for easy reading or text-to-speech rendering.`;
      }

      // Build contents parts for the multimodal query
      const contentsParts: any[] = [];

      // If there is an image in the user's message, extract the base64 content
      if (lastUserMsg.image) {
        const imageBase64 = lastUserMsg.image;
        // Strip data-uri metadata if present
        const cleanBase64 = imageBase64.includes(",") 
          ? imageBase64.split(",")[1] 
          : imageBase64;
        
        contentsParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        });
      }

      // Add text part
      contentsParts.push({
        text: lastUserMsg.text || "Analyze this photo in the context of stadium navigation or visitor help."
      });

      const registeredTools = [{
        functionDeclarations: [
          findRouteDeclaration,
          findNearestDeclaration,
          getAccessibilityInfoDeclaration,
          getCrowdStatusDeclaration
        ]
      }];

      // Query Gemini with tools/functions registered
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: contentsParts },
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: registeredTools
        },
      });

      // Check if model returned function calls
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const { name, args } = call;
        
        let functionResponseData: any = null;
        
        try {
          if (name === "find_route") {
            const { origin, destination, step_free_only } = args as any;
            const pathResult = findShortestPath(origin, destination, !!step_free_only, crowdStatus);
            
            // Map path IDs to readable names for the response
            const nodesMap = new Map(stadiumGraph.nodes.map(n => [n.id, n]));
            const readablePath = pathResult 
              ? pathResult.path.map(id => nodesMap.get(id)?.name || id)
              : [];

            functionResponseData = {
              success: !!pathResult,
              result: pathResult ? {
                ...pathResult,
                readable_steps: readablePath
              } : null,
              message: pathResult 
                ? `Successfully calculated route from ${origin} to ${destination}.`
                : `Could not find a valid route between ${origin} and ${destination}.`
            };
          } else if (name === "find_nearest") {
            const { amenity_type, origin } = args as any;
            const nearestResult = findNearestAmenity(origin, amenity_type);
            
            const nodesMap = new Map(stadiumGraph.nodes.map(n => [n.id, n]));
            const readablePath = nearestResult?.pathResult
              ? nearestResult.pathResult.path.map((id: string) => nodesMap.get(id)?.name || id)
              : [];

            functionResponseData = {
              success: !!nearestResult,
              result: nearestResult ? {
                nearestNode: nearestResult.nearestNode,
                pathResult: {
                  ...nearestResult.pathResult,
                  readable_steps: readablePath
                }
              } : null,
              message: nearestResult
                ? `Nearest ${amenity_type} from ${origin} is ${nearestResult.nearestNode.name}.`
                : `No nearby ${amenity_type} found from ${origin}.`
            };
          } else if (name === "get_accessibility_info") {
            const { location } = args as any;
            // Search by exact ID first, or substring search by name
            const node = stadiumGraph.nodes.find(n => 
              n.id === location || 
              n.name.toLowerCase().includes(location.toLowerCase())
            );

            if (node) {
              functionResponseData = {
                success: true,
                result: {
                  id: node.id,
                  name: node.name,
                  type: node.type,
                  step_free: node.step_free,
                  details: node.step_free
                    ? `${node.name} is fully step-free and accessible for wheelchairs.`
                    : `${node.name} contains steps/stairs and is not fully step-free.`
                }
              };
            } else {
              functionResponseData = {
                success: false,
                message: `Location '${location}' was not found in our database.`
              };
            }
          } else if (name === "get_crowd_status") {
            const { zone_id } = args as any;
            if (zone_id && crowdStatus[zone_id]) {
              functionResponseData = {
                success: true,
                zone_id,
                density: crowdStatus[zone_id],
                details: `Zone ${zone_id} currently has ${crowdStatus[zone_id]} crowd density.`
              };
            } else {
              functionResponseData = {
                success: true,
                crowd_status: crowdStatus,
                details: `Crowd densities across all zones: North (${crowdStatus.north}), South (${crowdStatus.south}), East (${crowdStatus.east}), West (${crowdStatus.west}).`
              };
            }
          }
        } catch (funcErr: any) {
          console.error("Error executing function call locally:", funcErr);
          functionResponseData = {
            success: false,
            error: funcErr.message || "Execution error"
          };
        }

        // Construct the contents payload for the second call to complete the function calling loop
        const nextContents = [
          {
            role: "user",
            parts: contentsParts
          },
          {
            role: "model",
            parts: [
              {
                functionCall: {
                  name: call.name,
                  args: call.args,
                  id: call.id
                }
              }
            ]
          },
          {
            role: "tool",
            parts: [
              {
                functionResponse: {
                  name: call.name,
                  response: functionResponseData,
                  id: call.id
                }
              }
            ]
          }
        ];

        // Second call to Gemini to let it formulate the final natural language answer
        const finalResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: nextContents,
          config: {
            systemInstruction,
            temperature: 0.7,
            tools: registeredTools
          }
        });

        const responseText = finalResponse.text || "I processed the request but was unable to formulate the directions.";
        res.json({ text: responseText });
        return;
      }

      // If no function call was triggered by the model, just return the standard response
      const responseText = response.text || "I'm sorry, I couldn't formulate a response. How can I help you navigate the stadium?";
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to process chat response from Gemini." });
    }
  });

  // API 5: Photo translation for overlays
  app.post("/api/translate-photo", async (req, res) => {
    try {
      const { image, currentLanguage } = req.body;
      if (!image) {
        res.status(400).json({ error: "No image provided." });
        return;
      }

      let ai;
      try {
        ai = getGeminiClient();
      } catch (keyErr: any) {
        res.status(401).json({
          error: "API key missing",
          message: "Please configure your GEMINI_API_KEY."
        });
        return;
      }

      const cleanBase64 = image.includes(",") ? image.split(",")[1] : image;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Read all visible text in this stadium ticket, menu, sign, or item, and translate it into the selected language (language requested: "${currentLanguage || 'en'}"). 
Provide ONLY the translated text in a concise, highly readable format, suitable to be displayed as an overlay. Do not add any conversational filler, intro, or markdown fences; just output the translation directly.`
          }
        ],
        config: {
          temperature: 0.3
        }
      });

      const translation = response.text || "No text detected in photo.";
      res.json({ translation: translation.trim() });
    } catch (error: any) {
      console.error("Photo Translation Error:", error);
      res.status(500).json({ error: error.message || "Failed to translate photo." });
    }
  });

  // Vite or Static Assets middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Compass26 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
