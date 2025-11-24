

const fs = require('fs');
const path = require('path');

const functionBridgePath = path.join(__dirname, '../src/lib/function-bridge.ts');
const functionsDirPath = path.join(__dirname, '../src/lib/firebase/functions');

const functionBridgeContent = fs.readFileSync(functionBridgePath, 'utf-8');

const lines = functionBridgeContent.split('\n');

for (const line of lines) {
  const match = line.match(/async (\w+)\(payload/);
  if (match) {
    const functionName = match[1];
    const isCallable = line.includes('callCallable');
    const isHttp = line.includes('callHttpFunction');

    if (isCallable || isHttp) {
        const firebaseFunctionNameMatch = line.match(/\"([^\"]*)\"/);
        if (firebaseFunctionNameMatch) {
            const firebaseFunctionName = firebaseFunctionNameMatch[1];
            let template;
            if (isCallable) {
                template = `
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export const ${functionName} = async (payload: any): Promise<any> => {
  if (!functions) {
    throw new Error("Firebase Functions not configured");
  }

  try {
    const callable = httpsCallable(functions, "${firebaseFunctionName}");
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    console.error("Callable ${functionName} failed:", error);
    throw error;
  }
};
`;
            } else {
                template = `
import { callHttpFunction } from "./utils";

export const ${functionName} = async (payload: any): Promise<any> => {
  return callHttpFunction("${firebaseFunctionName}", { body: payload });
};
`;
            }

            const filePath = path.join(functionsDirPath, `${functionName}.ts`);
            fs.writeFileSync(filePath, template.trim());
            console.log(`Created ${filePath}`);
        }
    }
  }
}

