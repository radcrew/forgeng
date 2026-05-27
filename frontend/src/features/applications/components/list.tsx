import type { Application } from "@types";

import { Row } from "./row";

export type ListProps = {
  applications: Application[];
  onSelect: (application: Application) => void;
};

export const List = ({ applications, onSelect }: ListProps) => (
  <div className="space-y-3">
    {applications.map((app) => (
      <Row
        key={app.id}
        application={app}
        onSelect={() => onSelect(app)}
      />
    ))}
  </div>
);
