package skills.default

default allow = false

risk_threshold := 30

allow {
  count(deny) == 0
}

autoapprove {
  count(deny) == 0
  input.skill.spec.class != "commit"
  input.risk.score <= risk_threshold
}

deny[msg] {
  input.skill.spec.class == "commit"
  not input.approval.human_approved
  msg := "human approval required for commit class"
}

deny[msg] {
  input.request.coordinates.frontier_hops > input.skill.spec.coordinates.frontier_hops
  msg := sprintf("requested frontier_hops %v exceeds declared limit %v", [input.request.coordinates.frontier_hops, input.skill.spec.coordinates.frontier_hops])
}

deny[msg] {
  contains_value(input.skill.spec.policy.deny, "live_prod_write")
  input.request.intent.write_live_prod == true
  msg := "live prod write forbidden by descriptor"
}

deny[msg] {
  contains_value(input.skill.spec.policy.deny, "pii_export")
  input.request.intent.export_pii == true
  msg := "pii export forbidden by descriptor"
}

deny[msg] {
  required := input.skill.spec.evidence.require[_]
  not present_evidence[required]
  msg := sprintf("missing required evidence: %s", [required])
}

deny[msg] {
  input.request.coordinates.env == "prod"
  input.skill.spec.class != "read"
  not input.approval.human_approved
  msg := "non-read production execution requires human approval"
}

present_evidence[e] {
  input.run.evidence_present[_] == e
}

contains_value(xs, v) {
  some i
  xs[i] == v
}
