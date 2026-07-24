def test_job_crud_roundtrip(client):
    create_resp = client.post(
        "/api/v1/jobs", json={"name": "Cafe A", "employer_type": "award", "state": "NSW"}
    )
    assert create_resp.status_code == 201
    job_id = create_resp.json()["id"]

    list_resp = client.get("/api/v1/jobs")
    assert list_resp.status_code == 200
    assert any(j["id"] == job_id for j in list_resp.json())

    patch_resp = client.patch(f"/api/v1/jobs/{job_id}", json={"name": "Cafe A Renamed"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Cafe A Renamed"

    delete_resp = client.delete(f"/api/v1/jobs/{job_id}")
    assert delete_resp.status_code == 204

    # Soft-deleted job should not appear in the default (active-only) list
    list_after_delete = client.get("/api/v1/jobs").json()
    assert not any(j["id"] == job_id for j in list_after_delete)
    list_with_inactive = client.get("/api/v1/jobs?include_inactive=true").json()
    assert any(j["id"] == job_id for j in list_with_inactive)


def test_job_pay_rule_rejects_both_preset_and_custom_fields(client):
    job_id = client.post(
        "/api/v1/jobs", json={"name": "Cafe B", "employer_type": "cash", "state": "NSW"}
    ).json()["id"]
    preset_id = client.post(
        "/api/v1/pay-rate-presets",
        json={
            "name": "Preset",
            "base_hourly_rate": "25",
            "saturday_rate": "31.25",
            "sunday_rate": "37.5",
            "public_holiday_rate": "50",
            "effective_from": "2026-01-01",
        },
    ).json()["id"]

    response = client.post(
        f"/api/v1/jobs/{job_id}/pay-rules",
        json={
            "rule_type": "preset",
            "preset_id": preset_id,
            "custom_weekday_rate": "20",
            "effective_from": "2026-01-01",
        },
    )
    assert response.status_code == 422


def test_job_pay_rule_rejects_overlapping_effective_ranges(client):
    job_id = client.post(
        "/api/v1/jobs", json={"name": "Cafe C", "employer_type": "cash", "state": "NSW"}
    ).json()["id"]

    first = client.post(
        f"/api/v1/jobs/{job_id}/pay-rules",
        json={
            "rule_type": "custom",
            "custom_weekday_rate": "20",
            "custom_saturday_rate": "25",
            "custom_sunday_rate": "30",
            "custom_public_holiday_rate": "40",
            "effective_from": "2026-01-01",
        },
    )
    assert first.status_code == 201

    overlapping = client.post(
        f"/api/v1/jobs/{job_id}/pay-rules",
        json={
            "rule_type": "custom",
            "custom_weekday_rate": "22",
            "custom_saturday_rate": "27",
            "custom_sunday_rate": "32",
            "custom_public_holiday_rate": "42",
            "effective_from": "2026-06-01",
        },
    )
    assert overlapping.status_code == 422


def test_job_pay_rule_allows_omitting_sunday_and_public_holiday_rates(client):
    job_id = client.post(
        "/api/v1/jobs", json={"name": "Cafe D", "employer_type": "cash", "state": "NSW"}
    ).json()["id"]

    response = client.post(
        f"/api/v1/jobs/{job_id}/pay-rules",
        json={
            "rule_type": "custom",
            "custom_weekday_rate": "20",
            "custom_saturday_rate": "25",
            "effective_from": "2026-01-01",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["custom_sunday_rate"] is None
    assert body["custom_public_holiday_rate"] is None


def test_job_pay_rule_requires_weekday_and_saturday_rates(client):
    job_id = client.post(
        "/api/v1/jobs", json={"name": "Cafe E", "employer_type": "cash", "state": "NSW"}
    ).json()["id"]

    response = client.post(
        f"/api/v1/jobs/{job_id}/pay-rules",
        json={
            "rule_type": "custom",
            "custom_saturday_rate": "25",
            "effective_from": "2026-01-01",
        },
    )
    assert response.status_code == 422
