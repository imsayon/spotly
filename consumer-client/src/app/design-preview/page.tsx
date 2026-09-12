import { notFound } from "next/navigation";
import { InterfaceCollection } from "../../../../packages/ui/src/design-preview/InterfaceCollection";

export default function DesignPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <>
      <div
        style={{
          padding: 16,
          background: "#282723",
          color: "#fffdf9",
          fontFamily: "sans-serif",
        }}
      >
        Historical design exploration · These samples are isolated from live
        accounts. Review the production routes for the final interface.
      </div>
      <InterfaceCollection initialRole="consumer" />
    </>
  );
}
