import * as fs from "fs";
import path from "path";

/**
 * 파일의 루트에 $schema 키가 있으면 'schema', 없으면 'json'을 반환합니다.
 * @param filePath 검사할 파일 경로
 * @returns 'schema' | 'json'
 */
export function detectJsonTypeBySchemaKey(filePath: string): JsonType {
  const fileName = path.basename(filePath).toLowerCase();
  const normalizedPath = path.normalize(filePath).toLowerCase();

  let srcLang: "schema" | "json" = "json";

  if (fileName.endsWith(".schema.json")) {
    return "schema";
  } else if (fileName.endsWith(".data.json")) {
    return "json";
  }

  if ( fileName.includes("schema") || normalizedPath.includes(path.sep + "schema" + path.sep) ) {
    srcLang = "schema";
  }

  if (fileName.includes("data") || srcLang === "json") {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const obj = JSON.parse(content);
      if (typeof obj === "object" && obj !== null && "$schema" in obj) {
        srcLang = "schema";
      }else {
        srcLang = "json";
      }
    } catch (e) {
      console.error(`Error reading or parsing file: ${filePath}`, e);
    }
  }

  return srcLang;
}

// enum 타입 정의
export type JsonType = "schema" | "json";