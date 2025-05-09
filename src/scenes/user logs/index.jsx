import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  Button,
  Modal,
  TextField,
  Alert,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { 
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport
} from '@mui/x-data-grid';
import { tokens } from "../../theme";
import Header from "../../components/Header";

// Import user logs service
import {
  getUserLogs,
  addUserLog,
  updateUserLog,
  deleteUserLog
} from "../../services/userLogsService.ts";

const CustomToolbar = ({ searchText, onSearchChange, dateFilter, onDateChange }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <GridToolbarContainer sx={{ padding: "8px" }}>
      <Box
        sx={{
          p: 0.5,
          pb: 0,
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 2
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            width: "300px",
            "& .MuiOutlinedInput-root": {
              backgroundColor: colors.primary[400],
              color: colors.grey[100],
              "& fieldset": {
                borderColor: colors.grey[400],
              },
              "&:hover fieldset": {
                borderColor: colors.grey[300],
              },
            },
            "& .MuiOutlinedInput-input": {
              color: colors.grey[100],
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: colors.grey[100],
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}
          >
            Search by date:
          </Typography>
          <TextField
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            sx={{
              width: "200px",
              "& .MuiOutlinedInput-root": {
                backgroundColor: colors.primary[400],
                color: colors.grey[100],
                "& fieldset": {
                  borderColor: colors.grey[400],
                },
                "&:hover fieldset": {
                  borderColor: colors.grey[300],
                },
              },
              "& .MuiOutlinedInput-input": {
                color: colors.grey[100],
                "&::-webkit-calendar-picker-indicator": {
                  cursor: "pointer"
                }
              },
            }}
          />
        </Box>
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </Box>
    </GridToolbarContainer>
  );
};

const UserLogs = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  });
  const [sortModel, setSortModel] = useState([
    {
      field: 'timestamp',
      sort: 'desc',
    },
  ]);
  const [searchText, setSearchText] = useState("");
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const data = await getUserLogs();
    setAllLogs(data);  // Store all logs
    setLogs(data);     // Set current displayed logs
  };

  const handleOpenModal = (log = null) => {
    setCurrentLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLog(null);
  };

  const handleSaveLog = async () => {
    const now = new Date();
    const formattedLog = {
      ...currentLog,
      log_id: currentLog.log_id || `LOG-${Date.now()}`,
      date: now.toISOString().split('T')[0], // Format: YYYY-MM-DD
      time: now.toTimeString().split(' ')[0], // Format: HH:MM:SS
    };

    if (currentLog.id) {
      await updateUserLog(currentLog.id, formattedLog);
    } else {
      await addUserLog(formattedLog);
    }
    await fetchLogs();
    handleCloseModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentLog({ ...currentLog, [name]: value });
  };

  const handleSearch = (searchValue) => {
    setSearchText(searchValue);
    
    let filteredLogs = [...allLogs];
    
    // Apply date filter if exists
    if (dateFilter) {
      filteredLogs = filteredLogs.filter(log => log.date === dateFilter);
    }
    
    // Apply search filter if exists
    if (searchValue) {
      filteredLogs = filteredLogs.filter(log => 
        Object.values(log).some(value => 
          value && value.toString().toLowerCase().includes(searchValue.toLowerCase())
        )
      );
    }
    
    setLogs(filteredLogs);
    setFilterModel({
      ...filterModel,
      quickFilterValues: searchValue ? [searchValue] : []
    });
  };

  const handleDateChange = async (date) => {
    setDateFilter(date);
    
    let filteredLogs = [...allLogs];
    
    // Apply date filter if exists
    if (date) {
      filteredLogs = filteredLogs.filter(log => log.date === date);
    }
    
    // Apply search filter if exists
    if (searchText) {
      filteredLogs = filteredLogs.filter(log => 
        Object.values(log).some(value => 
          value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    
    setLogs(filteredLogs);
    setFilterModel({
      ...filterModel,
      items: [
        ...filterModel.items.filter(item => item.field !== 'date'),
        ...(date ? [{
          field: 'date',
          operator: 'equals',
          value: date
        }] : [])
      ],
      quickFilterValues: searchText ? [searchText] : []
    });
  };

  const columns = [
    { 
      field: "log_id", 
      headerName: "Log ID",
      flex: 0.7,
    },
    { 
      field: "username", 
      headerName: "Username", 
      flex: 1,
      cellClassName: "name-column--cell"
    },
    { 
      field: "action", 
      headerName: "Action", 
      flex: 1, 
      cellClassName: "action-column--cell" 
    },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        // Split the yyyy-mm-dd format
        const [year, month, day] = value.split('-');
        // Create date string in desired format
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
      }
    },
    {
      field: "time",
      headerName: "Time",
      flex: 1,
      valueFormatter: ({ value }) => {
        if (!value) return '';
        // Convert 24-hour format to 12-hour format
        const [hours, minutes, seconds] = value.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes}:${seconds} ${ampm}`;
      }
    }
  ];

  return (
    <Box m="20px">
      <Header title="Audit Trails"/>
      <Box m="0px 0 0 0" height="87vh">
        <DataGrid
          checkboxSelection
          rows={logs}
          columns={columns}
          components={{
            Toolbar: CustomToolbar
          }}
          componentsProps={{
            toolbar: {
              searchText,
              onSearchChange: handleSearch,
              dateFilter,
              onDateChange: handleDateChange,
            }
          }}
          sortModel={sortModel}
          onSortModelChange={(newModel) => setSortModel(newModel)}
          filterModel={filterModel}
          onFilterModelChange={(newModel) => setFilterModel(newModel)}
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          onRowDoubleClick={(params) => handleOpenModal(params.row)}
          initialState={{
            sorting: {
              sortModel: [{ field: 'timestamp', sort: 'desc' }],
            },
          }}
          sx={{
            ...dataGridStyles(colors),
            border: "none",
            paddingTop: "5px",
          }}
        />
      </Box>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: colors.primary[400],
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            name="username"
            value={currentLog?.username || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <TextField
            label="Action"
            fullWidth
            margin="normal"
            name="action"
            value={currentLog?.action || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <TextField
            label="User ID"
            fullWidth
            margin="normal"
            name="user_id"
            value={currentLog?.user_id || ''}
            onChange={handleChange}
            sx={textFieldStyle(colors)}
          />

          <Box mt={2} display="flex" justifyContent="space-between">
            <Button 
              variant="contained" 
              onClick={handleSaveLog}
              sx={{
                backgroundColor: colors.greenAccent[600],
                "&:hover": { backgroundColor: colors.greenAccent[700] }
              }}
            >
              Save
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCloseModal}
              sx={{
                backgroundColor: colors.grey[500],
                "&:hover": { backgroundColor: colors.grey[700] }
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

const textFieldStyle = (colors) => ({
  input: { color: colors.grey[100] },
  label: { color: colors.grey[100] },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: colors.grey[400],
    },
    '&:hover fieldset': {
      borderColor: colors.grey[300],
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.grey[200],
    },
  }
});

const dataGridStyles = (colors) => ({
  "& .MuiDataGrid-root": {
    border: "none",
    fontSize: "16px",
    borderRadius: "16px",  // rounded corners
    overflow: "hidden",    // rounded corners
  },
  "& .MuiDataGrid-cell": {
    borderBottom: "none",
    color: colors.grey[100],
    fontSize: "15px",
  },
  "& .name-column--cell": {
    color: colors.grey[100],
  },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: colors.grey[400],
    borderBottom: "none",
    color: colors.grey[900],
    fontSize: "16px",
    fontWeight: "bold",
    borderTopLeftRadius: "16px",    // rounded corners
    borderTopRightRadius: "16px",   // rounded corners
  },
  "& .MuiDataGrid-virtualScroller": {
    backgroundColor: colors.grey[900],
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: "none",
    backgroundColor: colors.grey[400],
    color: colors.grey[900],
    borderBottomLeftRadius: "16px",    // rounded corners
    borderBottomRightRadius: "16px",   // rounded corners
  },
  "& .MuiCheckbox-root": {
    color: `${colors.grey[700]} !important`,
  },
  "& .MuiDataGrid-toolbarContainer": {
    padding: 2,
    "& .MuiButton-root": {
      color: colors.grey[100],
      fontSize: "14px",
    },
  },
  "& .MuiDataGrid-cell:focus": {
    outline: "  ",
  },
  "& .MuiDataGrid-row": {
    "&:hover": {
      backgroundColor: colors.grey[800],
    },
  },
  "& .MuiTablePagination-root": {
    color: colors.grey[900],
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    "& .MuiTablePagination-selectLabel": {
      fontSize: "15px",
      marginBottom: 0,
      marginTop: 0,
    },
    "& .MuiTablePagination-displayedRows": {
      fontSize: "15px",
      marginBottom: 0,
      marginTop: 0,
    },
    "& .MuiSelect-select": {
      fontSize: "15px",
      paddingTop: 0,
      paddingBottom: 0,
    },
    "& .MuiTablePagination-select": {
      marginRight: "8px",
      marginLeft: "8px",
    },
    "& .MuiTablePagination-toolbar": {
      minHeight: "auto",
      height: "48px",
      display: "flex",
      alignItems: "center",
    },
  },
  "& .MuiIconButton-root": {
    color: colors.grey[400],
  },
});

export default UserLogs;