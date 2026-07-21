def test_rent_period_with_empty_optional_fields_does_not_crash(client):
    # HTML forms submit unfilled optional number/date inputs as "" rather than
    # omitting them; the API must treat that the same as not provided.
    response = client.post(
        "/api/v1/rent-periods",
        json={
            "label": "Room",
            "amount": "300",
            "cycle_days": 14,
            "start_date": "2026-07-01",
            "end_date": "",
            "deposit_amount": "",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["end_date"] is None
    assert body["deposit_amount"] is None
