import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import Toolbar from "@mui/material/Toolbar";

export default function DenseAppBar() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "horizontal",
        width: "100%",
      }}
    >
      <AppBar position="static">
        <Toolbar variant="dense">
          <IconButton>
            <WhatshotIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{ fontFamily: "roboto", fontWeight: 700 }}
          >
            Hot or Not
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
