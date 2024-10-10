import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import { Dialog, Toolbar } from "@mui/material";
import { AppBar, Grid, IconButton, Slide } from "@mui/material/";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { TransitionProps } from "@mui/material/transitions";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import zkEmailLogo from "../assets/ZKEmailLogo.svg";

const NAV_LINKS = [
  { link: "https://prove.email/blog", title: "Blog" },
  { link: "https://zkemail.gitbook.io/zk-email", title: "Docs" },
  { link: "https://prove.email/", title: "Demos" },
  { link: "https://t.me/zkemail", title: "Contact" },
];

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MobileNav = ({
  open,
  onClose,
  pages,
}: {
  open: boolean;
  onClose: () => void;
  pages: Array<{ title: string; link: string }>;
}) => {
  const theme = useTheme();
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          backgroundColor: "black",
          position: "relative", // Ensure relative positioning
          padding: "1rem",
        },
      }}
    >
      <AppBar sx={{ position: "relative", background: "black" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <IconButton
            edge="start"
            color="inherit"
            href="/"
            aria-label="home"
          ></IconButton>

          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Grid
        container
        direction="column"
        spacing={1}
        sx={{ padding: "1.5%", paddingTop: "40px" }}
      >
        {pages.map((page) => (
          <Grid item key={page.title}>
            <Typography
              variant="h4"
              component="a"
              href={page.link}
              sx={{
                display: "inline-block", // Ensures the underline is as wide as the text
                color: "white",
                textDecoration: "none",
                marginBottom: theme.spacing(3),
                position: "relative",

                "&:hover": {
                  opacity: 0.8,
                  "&::after": {
                    transform: "scaleX(1)",
                    height: "2px",
                    backgroundColor: theme.palette.secondary.main, // Underline color
                    transformOrigin: "bottom left",
                    transition: "transform 0.3s ease-out",
                  },
                },

                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  backgroundColor: theme.palette.secondary.main, // Underline color
                  transform: "scaleX(0)",
                  transformOrigin: "bottom left",
                  transition: "transform 0.3s ease-out",
                },
              }}
            >
              {page.title}
            </Typography>
          </Grid>
        ))}
      </Grid>
      <Grid
        item
        container
        gap={2}
        alignItems={"center"}
        direction={"column"}
        style={{ marginTop: "auto", marginBottom: "2rem" }}
      >
        <Button
          variant="outlined"
          href="https://prove.email/blog/recovery"
          target="_blank"
          sx={{
            marginRight: theme.spacing(2),
            color: 'white',
            textTransform: "none",
          }}
        >
          Learn More
        </Button>
      </Grid>
    </Dialog>
  );
};

const NavBar: React.FC = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <AppBar
        position="static"
        sx={{
          width: "100%",
          backgroundColor: "white",
          paddingY: "0px",
          boxShadow: {
            xs: "none", // No box shadow on small screens
            md: "0px 1px 7px rgba(0, 0, 0, 0.02)", // Box shadow on medium and larger screens
          },
          zIndex: "10",
          position: "relative",
          borderBottom: "0.5px solid black",
          paddingX: { xs: "20px", sm: "5px", md: "0px" },
        }}
      >
        <Grid
          container
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Grid
            item
            xs={9}
            sm={4}
            md={3}
            sx={{
              borderRight: { md: "0.5px solid black" },
              paddingY: "1rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: { xs: "left", md: "center" },
              }}
            >
              <Link to="/">
                <img style={{ verticalAlign: "middle" }} src={zkEmailLogo} />
              </Link>
            </Box>
          </Grid>
          <Grid
            item
            sm={5}
            md={6}
            sx={{
              display: { xs: "none", sm: "none", md: "flex" },
              borderRight: "0.5px solid black",
              paddingLeft: "1.5625rem",
              paddingY: "0.625rem",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {NAV_LINKS.map((navLink) => {
                return (
                  <Button
                    href={navLink.link}
                    target="_blank"
                    sx={{
                      marginRight: {
                        sm: theme.spacing(1),
                        md: theme.spacing(2),
                      },
                      textTransform: "none",
                    }}
                  >
                    {navLink.title}
                  </Button>
                );
              })}
            </Box>
          </Grid>
          <Grid item>
            <IconButton
              sx={{
                display: { xs: "flex", sm: "none" },
                color: theme.palette.text.primary,
                right: "auto",
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "50%",
              }}
              onClick={handleClickOpen}
            >
              <MenuIcon fill="#454545" />
            </IconButton>
          </Grid>
          <Grid
            item
            xs={4}
            sm={4}
            md={3}
            sx={{
              paddingY: "10px",
              display: { xs: "none", sm: "flex" },
              justifyContent: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Button
                variant="outlined"
                href="https://prove.email/blog/recovery"
                target="_blank"
                sx={{
                  display: { xs: "none", lg: "block" },
                  textTransform: "none",
                  lineHeight: '14px'
                }}
              >
                Learn More
              </Button>
            </Box>
          </Grid>
        </Grid>
        <MobileNav open={open} onClose={handleClose} pages={NAV_LINKS} />
      </AppBar>
    </>
  );
};

export default NavBar;
