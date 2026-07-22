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


def _create_rent_period(client):
    return client.post(
        "/api/v1/rent-periods",
        json={
            "label": "Room",
            "amount": "300",
            "cycle_days": 14,
            "start_date": "2026-07-01",
        },
    ).json()["id"]


def test_confirm_rent_payment_and_list_history(client):
    period_id = _create_rent_period(client)

    create_resp = client.post(
        f"/api/v1/rent-periods/{period_id}/payments",
        json={"due_date": "2026-07-01", "paid_date": "2026-07-02", "amount": "300"},
    )
    assert create_resp.status_code == 201

    list_resp = client.get(f"/api/v1/rent-periods/{period_id}/payments")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["due_date"] == "2026-07-01"


def test_confirm_same_due_date_twice_is_rejected(client):
    period_id = _create_rent_period(client)
    client.post(
        f"/api/v1/rent-periods/{period_id}/payments",
        json={"due_date": "2026-07-01", "paid_date": "2026-07-01", "amount": "300"},
    )

    duplicate = client.post(
        f"/api/v1/rent-periods/{period_id}/payments",
        json={"due_date": "2026-07-01", "paid_date": "2026-07-03", "amount": "300"},
    )
    assert duplicate.status_code == 409


def test_delete_rent_payment_makes_due_date_unpaid_again(client):
    period_id = _create_rent_period(client)
    payment_id = client.post(
        f"/api/v1/rent-periods/{period_id}/payments",
        json={"due_date": "2026-07-01", "paid_date": "2026-07-01", "amount": "300"},
    ).json()["id"]

    delete_resp = client.delete(f"/api/v1/rent-periods/payments/{payment_id}")
    assert delete_resp.status_code == 204

    list_resp = client.get(f"/api/v1/rent-periods/{period_id}/payments")
    assert list_resp.json() == []


def test_deleting_rent_period_cascades_to_its_payments(client):
    period_id = _create_rent_period(client)
    client.post(
        f"/api/v1/rent-periods/{period_id}/payments",
        json={"due_date": "2026-07-01", "paid_date": "2026-07-01", "amount": "300"},
    )

    delete_resp = client.delete(f"/api/v1/rent-periods/{period_id}")
    assert delete_resp.status_code == 204

    # The period is gone, so its payments endpoint should 404 rather than orphan-list
    payments_resp = client.get(f"/api/v1/rent-periods/{period_id}/payments")
    assert payments_resp.status_code == 404
