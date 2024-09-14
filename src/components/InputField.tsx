import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { styled } from '@mui/system';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const CustomTextField = styled(TextField)(({ locked, status, statusColor }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '5px',
    border: `0.5px solid ${statusColor || '#DDDDDD'}`,
    backgroundColor: status === 'error' ?  'transparent' : status === 'okay' ? '#EAFFF0' : locked ? '#F9F9F9' : 'transparent',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: statusColor || '#DDDDDD',
  },
  '& .MuiInputBase-input': {
    padding: '10px 12px',
    color: '#667085',
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: status ? statusColor : '#ABBEFF',
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: status ? statusColor : '#ABBEFF',
  },
}));

interface InputFieldProps {
  type: string;
  value: string;
  label?: string;
  placeholderText?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  locked?: boolean;                             // 'false' enables the input field, 'true' disables the input field, default set to false
  status?: 'error' | 'okay' | 'waiting';        // 'okay', 'waiting', 'error' status changes colors input box, status icon and message color respectively
  statusNote?: string;                          // statusNote is a string message under the input field
}

const InputField: React.FC<InputFieldProps> = ({
  type,
  value,
  label,
  placeholderText,
  onChange,
  locked = false,
  status,
  statusNote,
}) => {
  let statusColor = '';
  let StatusIcon = null;

  if (status === 'error') {
    statusColor = '#FB3E3E';
    StatusIcon = InfoIcon;
  } else if (status === 'okay') {
    statusColor = '#0A6825';
    StatusIcon = CheckCircleIcon;
  } else if (status === 'waiting') {
    statusColor = '#94969C';
    StatusIcon = AccessTimeIcon;
  }

  return (
    <Box mb={2}>
      {label && (
        <Typography
          variant="body2"
          color="textPrimary"
          mb={1}
          sx={{ fontWeight: 500, color: '#454545' }}
        >
          {label}
        </Typography>
      )}
      <CustomTextField
        variant="outlined"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholderText}
        fullWidth
        disabled={locked}   // 'false' enables the input field, 'true' disables the input field, default set to false
        locked={locked}     // Ensure locked is passed as a boolean
        status={status}     // 'okay', 'waiting', 'error' status changes colors input box, status icon and message color respectively
        statusColor={statusColor}
      />
      {status && statusNote && (
        <Box display="flex" alignItems="center" alignContent="center" mt={1}>
          {StatusIcon && <StatusIcon sx={{ color: statusColor, mr: '3px', padding: '4px' }} />}
          <Typography
            variant="body2"
            sx={{ color: statusColor, fontWeight: '500'}}
          >
            {statusNote}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InputField;
