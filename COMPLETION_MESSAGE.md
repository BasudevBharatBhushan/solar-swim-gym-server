The error is valid: The `age_group_id` you provided (`408f3068-4189-44bc-bb47-8a9012dac7cf`) does not exist in the database.

Here are the available `age_group` IDs you can use:

*   **Adult**: `6144172c-d4d5-4b62-8c36-4d36762e21a8` (18-64)
*   **Senior**: `683a3e99-5f5a-46ef-9850-ca9d7a3a3d8c` (65-85)
*   **Child**: `7a877648-1b2c-42a9-bf26-b12e67ea36ef` (0.5-12)
*   **Junior**: `3b840fd5-f9a3-4f93-9fe3-65985b5c5ae6` (13-17)

Please update your `curl` request with one of these valid IDs. Also, ensure the `service_pack_id` (`f24dcbc2...`) actually matches the one you just created (`513de9fd...`), otherwise you will hit another foreign key error.

**Suggested cURL (using 'Adult' and your previously created pack):**
```bash
curl --location 'http://localhost:3001/api/v1/service-packs/prices/upsert' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZl9pZCI6IjZjNjE3YzM4LWNiZDUtNDAxMy1hYTVjLTgzOGVhOGMyZmZjNCIsInJvbGUiOiJTVVBFUkFETUlOIiwibG9jYXRpb25faWQiOm51bGwsInR5cGUiOiJzdGFmZiIsImlhdCI6MTc3MDM1OTE5OCwiZXhwIjoxNzcwNDQ1NTk4fQ.Qgcm2_TGVLrFdiDG2zpXUaKf4oLcjUbXqO2eIEAvWMA' \
--data '{
    "location_id": "490f7013-a95d-4664-b750-1ecbb98bd463",
    "service_pack_id": "513de9fd-894b-4020-80db-057fcda1f4e6",
    "age_group_id": "6144172c-d4d5-4b62-8c36-4d36762e21a8",
    "price": 150.00
}'
```
