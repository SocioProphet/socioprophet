# Intake UDM + Release Schema

## Top-level blocks
- context
- platform
- experiment
- policy
- udm

## Blue/green fields
- platform.releaseId
- platform.releaseSlot
- platform.deploymentStrategy
- platform.releaseManifestRef
- platform.formSchemaVersion
- platform.firestoreRuleset
- platform.firebaseAppId

## A/B fields
- experiment.experimentId
- experiment.variantId
- experiment.assignmentId
- experiment.ctaId
- experiment.landingPath

## UDM shape
- udm.metadata
- udm.principal
- udm.target
- udm.observer
- udm.network.http
- udm.additional
