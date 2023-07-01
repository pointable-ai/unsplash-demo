import { useColorModeValue, Box } from "@chakra-ui/react";
import RawCodeEditor from "@uiw/react-textarea-code-editor";

export const SqlEditor = ({
  query,
  onChange,
}: {
  query: string;
  onChange: (value: string) => void;
}) => {
  const color = useColorModeValue("light", "dark");
  const labelColor = useColorModeValue("black", "white");

  return (
    <Box sx={{ position: "relative" }}>
      <RawCodeEditor
        placeholder="SELECT * FROM collection;"
        language="sql"
        data-color-mode={color}
        value={query}
        minHeight={100}
        padding={24}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 14,
          fontFamily: "'Space Mono',monospace",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: -3,
          left: 2,
          color: labelColor,
          zIndex: 100,
        }}
      >
        SQL
      </Box>
    </Box>
  );
};
