import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon: the four-petal mark on ivory. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F2",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 20 20" fill="#C2603A">
          <rect x="1" y="1" width="8" height="8" rx="4" />
          <rect x="11" y="1" width="8" height="8" rx="4" />
          <rect x="1" y="11" width="8" height="8" rx="4" />
          <rect x="11" y="11" width="8" height="8" rx="4" />
        </svg>
      </div>
    ),
    size,
  );
}
