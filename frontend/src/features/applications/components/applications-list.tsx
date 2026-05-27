import type { Application } from "@types";
import { ApplicationListRow } from "./application-list-row";

interface ApplicationsListProps {
  applications: Application[];
  onSelect: (application: Application) => void;
}

export function ApplicationsList({
  applications,
  onSelect,
}: ApplicationsListProps) {
  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <ApplicationListRow
          key={app.id}
          application={app}
          onSelect={() => onSelect(app)}
        />
      ))}
    </div>
  );
}
