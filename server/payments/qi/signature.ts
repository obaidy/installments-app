import crypto from "crypto";
import fs from "fs";


function getPrivateKey(): string {
const fromEnv = process.env.QI_PRIVATE_KEY;
if (fromEnv) return fromEnv.replace(/\\n/g, "\n");
const path = process.env.QI_PRIVATE_KEY_PATH;
if (path) return fs.readFileSync(path, "utf8");
throw new Error("Qi private key not configured");
}


function signBase64(payload: string): string {
const signer = crypto.createSign("RSA-SHA256");
signer.update(payload);
signer.end();
return signer.sign(getPrivateKey(), "base64");
}


export function buildQiHeaders(method: string, path: string, body?: unknown, keyId?: string) {
const date = new Date().toUTCString();
const json = body ? JSON.stringify(body) : "";
const digest = body ? crypto.createHash("sha256").update(json).digest("base64") : undefined;


// Simplified HTTP Signature header (adjust to provider spec as needed)
const signatureInput = `(request-target): ${method.toLowerCase()} ${path}\ndate: ${date}` + (digest ? `\ndigest: SHA-256=${digest}` : "");
const signature = signBase64(signatureInput);


const headers: Record<string, string> = {
"content-type": "application/json",
date,
authorization: `Signature keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) date${digest ? " digest" : ""}",signature="${signature}"`,
};
if (digest) headers["digest"] = `SHA-256=${digest}`;
return headers;
}