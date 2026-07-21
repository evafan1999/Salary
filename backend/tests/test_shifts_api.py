from decimal import Decimal


def _make_job_with_custom_rule(client):
    job_id = client.post(
        "/api/v1/jobs", json={"name": "Cafe", "employer_type": "cash", "state": "NSW"}
    ).json()["id"]
    client.post(
        f"/api/v1/jobs/{job_id}/pay-rules",
        json={
            "rule_type": "custom",
            "custom_weekday_rate": "30",
            "custom_saturday_rate": "35",
            "custom_sunday_rate": "40",
            "custom_public_holiday_rate": "60",
            "effective_from": "2026-01-01",
        },
    )
    return job_id


def test_create_shift_returns_computed_pay(client):
    job_id = _make_job_with_custom_rule(client)

    # 2026-07-20 is a Monday
    response = client.post(
        "/api/v1/shifts",
        json={
            "job_id": job_id,
            "shift_date": "2026-07-20",
            "start_time": "09:00",
            "end_time": "17:00",
            "unpaid_break_minutes": 30,
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert Decimal(body["worked_hours"]) == Decimal("7.5")
    assert body["resolved_day_type"] == "weekday"
    assert Decimal(body["gross_pay"]) == Decimal("225")


def test_create_shift_without_applicable_rule_returns_422(client):
    job_id = client.post(
        "/api/v1/jobs", json={"name": "Cafe No Rule", "employer_type": "cash", "state": "NSW"}
    ).json()["id"]

    response = client.post(
        "/api/v1/shifts",
        json={
            "job_id": job_id,
            "shift_date": "2026-07-20",
            "start_time": "09:00",
            "end_time": "17:00",
        },
    )
    assert response.status_code == 422


def test_empty_string_day_type_override_is_treated_as_unset(client):
    # The frontend's "auto-detect" select option submits an empty string rather
    # than omitting the field entirely; this must not crash the pay calculator.
    job_id = _make_job_with_custom_rule(client)

    response = client.post(
        "/api/v1/shifts",
        json={
            "job_id": job_id,
            "shift_date": "2026-07-20",  # Monday
            "start_time": "09:00",
            "end_time": "17:00",
            "day_type_override": "",
        },
    )
    assert response.status_code == 201
    assert response.json()["resolved_day_type"] == "weekday"


def test_invalid_day_type_override_is_rejected(client):
    job_id = _make_job_with_custom_rule(client)

    response = client.post(
        "/api/v1/shifts",
        json={
            "job_id": job_id,
            "shift_date": "2026-07-20",
            "start_time": "09:00",
            "end_time": "17:00",
            "day_type_override": "not-a-real-day-type",
        },
    )
    assert response.status_code == 422


def test_shift_end_before_start_requires_crosses_midnight_flag(client):
    job_id = _make_job_with_custom_rule(client)

    response = client.post(
        "/api/v1/shifts",
        json={
            "job_id": job_id,
            "shift_date": "2026-07-20",
            "start_time": "22:00",
            "end_time": "02:00",
            "crosses_midnight": False,
        },
    )
    assert response.status_code == 422


def test_shift_pay_breakdown_endpoint(client):
    job_id = _make_job_with_custom_rule(client)
    shift_id = client.post(
        "/api/v1/shifts",
        json={
            "job_id": job_id,
            "shift_date": "2026-07-25",  # Saturday
            "start_time": "09:00",
            "end_time": "17:00",
        },
    ).json()["id"]

    response = client.get(f"/api/v1/shifts/{shift_id}/pay-breakdown")
    assert response.status_code == 200
    body = response.json()
    assert body["day_type"] == "saturday"
    assert Decimal(body["hourly_rate_applied"]) == Decimal("35")
