def test_index(client):
    response = client.get("/")
    assert b"It works!" in response.data
