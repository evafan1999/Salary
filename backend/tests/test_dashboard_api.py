from datetime import date, timedelta
from decimal import Decimal


def test_dashboard_summary_aggregates_all_domains(client):
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
            "effective_from": "2020-01-01",
        },
    )
    today = date.today()
    client.post(
        "/api/v1/shifts",
        json={
            "job_id": job_id,
            "shift_date": today.isoformat(),
            "start_time": "09:00",
            "end_time": "17:00",
        },
    )

    client.post(
        "/api/v1/rent-periods",
        json={
            "label": "Room",
            "amount": "300",
            "cycle_days": 14,
            "start_date": (today - timedelta(days=7)).isoformat(),
        },
    )

    loan_id = client.post(
        "/api/v1/car-loans",
        json={"description": "Car", "total_amount": "5000", "start_date": "2026-01-01"},
    ).json()["id"]
    client.post(
        f"/api/v1/car-loans/{loan_id}/payments",
        json={"payment_date": today.isoformat(), "amount": "500"},
    )

    client.post(
        "/api/v1/savings-goal",
        json={
            "target_amount": "10000",
            "target_date": (today + timedelta(days=100)).isoformat(),
            "starting_balance": "1000",
            "tracking_start_date": (today - timedelta(days=30)).isoformat(),
        },
    )

    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    body = response.json()

    # Expected rate depends on which day of the week "today" happens to be.
    weekday_num = today.weekday()
    if weekday_num == 5:
        expected_rate = Decimal("35")
    elif weekday_num == 6:
        expected_rate = Decimal("40")
    else:
        expected_rate = Decimal("30")
    assert Decimal(body["total_current_period_earnings"]) == expected_rate * 8
    assert len(body["earnings_by_job"]) == 1
    assert len(body["upcoming_rent"]) == 1
    assert len(body["car_loans"]) == 1
    assert Decimal(body["car_loans"][0]["remaining_balance"]) == Decimal("4500")
    assert body["savings_goal"] is not None
    assert body["savings_goal"]["is_active"] is True
