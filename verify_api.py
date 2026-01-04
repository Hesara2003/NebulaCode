import requests
import sys

BASE_URL = "http://localhost:4000"
WORKSPACE_ID = "script-test-workspace"
FILE_ID = "test-file.txt"
CONTENT = "Verified via script at "

def run_test():
    print(f"Testing against {BASE_URL}...")

    # 1. Save a file
    print(f"\n[1] Saving file '{FILE_ID}' to workspace '{WORKSPACE_ID}'...")
    save_url = f"{BASE_URL}/workspaces/{WORKSPACE_ID}/files/{FILE_ID}"
    try:
        response = requests.post(save_url, json={"content": CONTENT + "step 1"})
        if response.status_code in [200, 201]:
            print("✅ Save successful.")
        else:
            print(f"❌ Save failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    # 2. Read the file back
    print(f"\n[2] Reading file '{FILE_ID}'...")
    get_url = f"{BASE_URL}/workspaces/{WORKSPACE_ID}/files/{FILE_ID}"
    try:
        response = requests.get(get_url)
        if response.status_code == 200:
            data = response.json()
            # The backend returns a WorkspaceFile object with a 'content' field
            fetched_content = data.get("content")
            print(f"   Got content: {fetched_content}")
            
            if fetched_content == CONTENT + "step 1":
                print("✅ Content verification passed.")
            else:
                print("❌ Content verification failed!")
                sys.exit(1)
        else:
            print(f"❌ Read failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

    print("\n🎉 All tests passed!")

if __name__ == "__main__":
    run_test()
