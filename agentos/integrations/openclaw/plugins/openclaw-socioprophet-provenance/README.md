# OpenClaw Socioprophet Provenance plugin skeleton

This is a trusted-plugin skeleton, not a published runtime package yet.

What it does:
- uses `definePluginEntry(...)`
- registers typed lifecycle hooks with `api.on(...)`
- registers a narrow plugin-managed HTTP health route with `api.registerHttpRoute(...)`
- observes and logs lifecycle event data for provenance-oriented development

Why a plugin instead of only a standalone hook:
- plugin hooks sit on the native SDK surface
- plugin routes can be owned and authenticated at the plugin boundary
- the longer-term provenance surface belongs here, not in a fragile script-only hook

What is still TODO:
- pin exact event payload typings from the installed SDK version
- add explicit tests with the real `openclaw` package present
- decide whether `before_tool_call` should emit full pre-exec intent or only hashed summaries
