import type { Application } from "@types";

import { ApplicationRow } from "./row";

export type ApplicationListProps = {
  applications: Application[];
  onSelect: (application: Application) => void;
};

export const ApplicationList = ({ applications, onSelect }: ApplicationListProps) => (
  <div className="space-y-3">
    {applications.map((app) => (
      <ApplicationRow
        key={app.id}
        application={app}
        onSelect={() => onSelect(app)}
      />
    ))}
  </div>
);
