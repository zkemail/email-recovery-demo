import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import { Box, IconButton, TextField } from "@mui/material";
import MoreInfoDialog from "./MoreInfoDialog";

const InputNumber = ({
  value,
  onChange,
  min = 1,
  title,
  message,
  ...props
}) => {
  const handleIncrement = () => {
    if (value < Number.MAX_SAFE_INTEGER) {
      onChange({ target: { value: value + 1 } });
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange({ target: { value: value - 1 } });
    }
  };

  return (
    <Box>
      <Box
        sx={{
          height: "40px",
          display: "flex",
          alignItems: "center",
          border: "2px solid #DCDCDC",
          outline: "none",
          borderRadius: "8px",
          paddingX: "0.2rem",
          minWidth: "90px", // Adjust width as necessary
          maxWidth: "100px", // Adjust width as necessary
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          ml={1}
          sx={{ marginRight: "5px" }}
        >
          <IconButton
            size="small"
            onClick={handleIncrement}
            sx={{
              borderColor: "#ffffff",
              borderWidth: " 1px",
              borderStyle: "solid",
              backgroundColor: "#F0F0F0",
              borderRadius: "1px",
              padding: 0,
              "&:focus": {
                outline: "none",
                boxShadow: "none",
              },
            }}
          >
            <ArrowUpwardRoundedIcon sx={{ padding: "1px", fontSize: "12px" }} />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleDecrement}
            sx={{
              borderColor: "#ffffff",
              borderWidth: " 1px",
              borderStyle: "solid",
              backgroundColor: "#F0F0F0",
              borderRadius: "1px",
              padding: 0,
              "&:focus": {
                outline: "none",
                boxShadow: "none",
              },
            }}
          >
            <ArrowDownwardRoundedIcon
              sx={{ padding: "1px", fontSize: "12px" }}
            />
          </IconButton>
        </Box>
        <TextField
          value={value}
          onChange={onChange}
          type="number"
          inputProps={{ min }}
          variant="standard" // Use standard variant to have more control over the styles
          sx={{
            color: "#667085",
            width: "3rem",
            textAlign: "right",
            "& .MuiInputBase-input": {
              textAlign: "center", // Center the text
            },
            "& .MuiInputBase-root": {
              border: "none", // Remove the default border
              "&:before, &:after": {
                display: "none", // Remove the focus outline
              },
            },
            // Hide default number input arrows
            "& input[type=number]": {
              "-moz-appearance": "textfield",
            },
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              {
                "-webkit-appearance": "none",
                margin: 0,
              },
          }}
          {...props}
        />
        <MoreInfoDialog title={title} message={message} />
      </Box>
    </Box>
  );
};

export default InputNumber;
