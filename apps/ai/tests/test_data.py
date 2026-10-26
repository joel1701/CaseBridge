"""Guard synthetic evaluation labels against fixture drift."""
import csv
import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[3] / 'data'

def test_fixture_integrity():
    institutions = list(csv.DictReader((DATA / 'sample_institutions.csv').open()))
    complaints = list(csv.DictReader((DATA / 'sample_complaints.csv').open()))
    assert len(institutions) == 10
    assert len(complaints) == 25
    institution_ids = {row['id'] for row in institutions}
    assert {row['institutionId'] for row in complaints} == institution_ids
    assert len({row['permanentId'] for row in institutions}) == 10
    assert all(row['permanentId'].startswith('SYN-AICTE-') for row in institutions)
    by_id = {row['id']: row for row in complaints}
    assert len(by_id) == 25
    for pair in json.loads((DATA / 'known_case_pairs.json').read_text()):
        left, right = by_id[pair['sourceComplaintId']], by_id[pair['targetComplaintId']]
        if pair['related']:
            assert left['institutionId'] == right['institutionId']
            assert left['bureauId'] != right['bureauId']
    for action in json.loads((DATA / 'sample_actions.json').read_text()):
        assert action['bureauId'] == by_id[action['complaintId']]['bureauId']
