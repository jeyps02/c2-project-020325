import { useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Add useNavigate
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import RecentActorsOutlinedIcon from '@mui/icons-material/RecentActorsOutlined';
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import { getUsers } from "../../services/userService.ts";
import { addUserLog } from "../../services/userLogsService.ts";
import { getReviewLogs } from "../../services/reviewLogsService.ts";
import { useDetection } from "../../context/DetectionContext";

const Item = ({ title, to, icon, selected, setSelected, showAlert, count }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { showAlert: contextShowAlert } = useDetection();
  
  return (
    <MenuItem
      active={selected === title}
      style={{ color: colors.grey[100] }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Typography>{title}</Typography>
        {count > 0 && title === "Detections" && (
          <Box
            sx={{
              backgroundColor: '#ff9800',
              color: '#fff',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              minWidth: '24px',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            {count}
          </Box>
        )}
        {contextShowAlert && title === "Live Feed" && (
          <Box
            sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#f44336',
              animation: 'pulse-red 1.5s infinite',
              '@keyframes pulse-red': {
                '0%': {
                  transform: 'scale(0.95)',
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                },
                '70%': {
                  transform: 'scale(1)',
                  boxShadow: '0 0 0 7px rgba(244, 67, 54, 0)',
                },
                '100%': {
                  transform: 'scale(0.95)',
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                },
              },
            }}
          />
        )}
      </Box>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = ({ isSidebar }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation(); // Added useLocation hook
  const navigate = useNavigate(); // Add navigate hook
  const { violations, isDetecting, isFeedInitialized, showAlert } = useDetection();
  const [lastViolationCount, setLastViolationCount] = useState(0);
  const [userName, setUserName] = useState("Loading...");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  // Updated initialization of selected state
  const [selected, setSelected] = useState(() => {
    const path = location.pathname;
    const routeToTitle = {
      '/dashboard': 'Dashboard',
      '/live-feed': 'Live Feed',
      '/users': 'Users',
      '/policies': 'Policies',
      '/detectionlogs': 'Detections',
      '/audittrails': 'Audit Trails',
      '/violations': 'Violations', // Add this
      '/calendar': 'Calendar',
      '/faq': 'FAQ Page'
    };
    return routeToTitle[path] || 'Dashboard';
  });

  // Added effect to update selected state when route changes
  useEffect(() => {
    const path = location.pathname;
    const routeToTitle = {
      '/dashboard': 'Dashboard',
      '/live-feed': 'Live Feed',
      '/users': 'Users',
      '/policies': 'Policies',
      '/detectionlogs': 'Detections',
      '/audittrails': 'Audit Trails',
      '/violations': 'Violations', // Add this
      '/calendar': 'Calendar',
      '/faq': 'FAQ Page'
    };
    setSelected(routeToTitle[path] || 'Dashboard');
  }, [location]);

  useEffect(() => {
    const fetchUserData = async () => {
      const sessionUser = JSON.parse(sessionStorage.getItem('user'));
      
      if (sessionUser) {
        try {
          const users = await getUsers();
          const currentUser = users.find(u => u.username === sessionUser.username);
          
          if (currentUser) {
            setUserName(currentUser.username);
            setUserRole(currentUser.loa);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Add this useEffect to fetch and update the pending count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const logs = await getReviewLogs();
        const pendingLogs = logs.filter(log => log.status === 'Pending');
        setPendingCount(pendingLogs.length);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    // Initial fetch
    fetchPendingCount();

    // Set up interval to refresh count
    const interval = setInterval(fetchPendingCount, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setIsLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      const sessionUser = JSON.parse(sessionStorage.getItem('user'));
      
      if (sessionUser) {
        await addUserLog({
          log_id: sessionUser.log_id,
          username: sessionUser.username,
          action: "Logged Out",
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0]
        });
      }
      
      // Clear all session/local storage
      sessionStorage.clear();
      localStorage.clear();

      // Reset all states
      setUserName("Loading...");
      setSelected("Dashboard");
      setIsLogoutDialogOpen(false);

      // Navigate to login page
      navigate('/', { replace: true });
      
      // Force a page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const menuItems = {
    OSA: [
      { title: "Dashboard", to: "/dashboard", icon: <AnalyticsOutlinedIcon /> },
      //{ title: "Live Feed", to: "/live-feed", icon: <CameraAltOutlinedIcon />, showAlert: true },
      { title: "Users", to: "/users", icon: <PeopleOutlinedIcon /> },
      { title: "Policies", to: "/policies", icon: <ContactsOutlinedIcon /> },
      //{ title: "Detections", to: "/detectionlogs", icon: <ReceiptOutlinedIcon />, count: pendingCount },
      { title: "Violations", to: "/violations", icon: <HistoryEduOutlinedIcon /> },
      { title: "Audit Trails", to: "/audittrails", icon: <RecentActorsOutlinedIcon /> },
      { title: "Calendar", to: "/calendar", icon: <CalendarTodayOutlinedIcon /> },
      { title: "FAQ Page", to: "/faq", icon: <HelpOutlineOutlinedIcon /> }
    ],
    SOHAS: [
      { title: "Live Feed", to: "/live-feed", icon: <CameraAltOutlinedIcon />, showAlert: true },
      { title: "Detections", to: "/detectionlogs", icon: <ReceiptOutlinedIcon />, count: pendingCount },
      //{ title: "Calendar", to: "/calendar", icon: <CalendarTodayOutlinedIcon /> },
      { title: "FAQ Page", to: "/faq", icon: <HelpOutlineOutlinedIcon /> }
    ]
  };

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "10px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
      }}
    >
      <ProSidebar collapsed={!isSidebar}>
        <Menu iconShape="square">
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box display="flex" justifyContent="space-between" alignItems="center" ml="15px">
                <Typography variant="h3" color={colors.grey[100]}>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CAMPUSFIT
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src={`../../assets/user.png`}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {userName}
                </Typography>
                <Typography variant="h5" color={colors.greenAccent[500]}>
                  Logged-in User
                </Typography>
              </Box>
            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            {menuItems[userRole]?.map((item) => (
              <Item
                key={item.title}
                title={item.title}
                to={item.to}
                icon={item.icon}
                selected={selected}
                setSelected={setSelected}
                showAlert={item.showAlert}
                count={item.count}
              />
            ))}
            
            {/* Logout item - always visible */}
            <Item 
              title="Logout" 
              to="#" 
              icon={<ExitToAppOutlinedIcon />} 
              selected={selected} 
              setSelected={() => {
                setSelected("Logout");
                handleLogoutClick();
              }} 
            />
          </Box>
        </Menu>
      </ProSidebar>

      {/* Add the Logout Confirmation Dialog */}
      <Dialog
        open={isLogoutDialogOpen}
        onClose={handleLogoutCancel}
      >
        <DialogTitle sx={{ 
          fontWeight: "bold",
          color: colors.grey[100]
        }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to log out? You will need to sign in again to access your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleLogoutConfirm}
            sx={{
              color: colors.grey[100],
              fontWeight: "bold",
              backgroundColor: '#ffd700',
              "&:hover": {
                backgroundColor: '#e6c200',
              },
            }}
            variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;
