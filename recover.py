import json
import os
import ast

log_file = r"C:\Users\natha\.gemini\antigravity-ide\brain\aaef8e5c-e632-45c1-bdba-04b284ccf1bf\.system_generated\logs\transcript.jsonl"
workspace = r"c:\Users\natha\OneDrive\Desktop\Projeto IGOR"

files = {}

with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if "tool_calls" in data:
            for call in data["tool_calls"]:
                name = call.get("name")
                args = call.get("args", {})
                if name == "write_to_file" or name == "replace_file_content":
                    target = args.get("TargetFile", "")
                    if target.startswith('"'):
                        target = json.loads(target)
                    
                    if workspace.lower() in target.lower():
                        content = args.get("CodeContent", args.get("ReplacementContent", ""))
                        if content.startswith('"'):
                            try:
                                content = json.loads(content)
                            except:
                                pass
                        if content:
                            files[target] = content

for target, content in files.items():
    print(f"Restoring {target}")
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8") as out:
        out.write(content)

print(f"Restored {len(files)} files.")
