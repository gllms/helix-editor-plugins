function escapeWorkflowCommand(value: string, isProperty = false) {
  const escaped = value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  return isProperty ? escaped.replace(/:/g, "%3A").replace(/,/g, "%2C") : escaped;
}

export default function warn(title: string, message: string) {
  if (process.env.GITHUB_ACTIONS === "true") {
    console.log(
      `::warning title=${escapeWorkflowCommand(title, true)}::${escapeWorkflowCommand(message)}`,
    );
  } else {
    console.warn(`Warning: ${title}: ${message}`);
  }
}
