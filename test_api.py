import requests

BASE_URL = "http://localhost:3001/api/v1"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZl9pZCI6IjZjNjE3YzM4LWNiZDUtNDAxMy1hYTVjLTgzOGVhOGMyZmZjNCIsInJvbGUiOiJTVVBFUkFETUlOIiwibG9jYXRpb25faWQiOm51bGwsInR5cGUiOiJzdGFmZiIsImlhdCI6MTc3MDYxMTA2OSwiZXhwIjoxNzcwNjk3NDY5fQ.MuhtlbAXeXAvyozDgcgoXYOU2-YLVabBV0Sx2-owdg4"

def test_api():
    owner_id = "972fe9dc-8004-4fa7-b95d-ab905d57ddbb"  # Correct ID from screenshot
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "x-location-id": "490f7013-a95d-4664-b750-1ecbb98bd463" 
    }
    
    url = f"{BASE_URL}/membership-services/{owner_id}"
    print(f"Testing GET {url}...")
    
    r = requests.get(url, headers=headers)
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text}")

if __name__ == "__main__":
    test_api()
