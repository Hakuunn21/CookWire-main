import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { ExpandMoreRounded } from '@mui/icons-material'
import { memo } from 'react'
import { OSS_LICENSES } from './ossLicenses'

const InfoView = memo(function InfoView({ open, type, onClose, t }) {
  const getContent = () => {
    switch (type) {
      case 'oss':
        return (
          <Box>
            {OSS_LICENSES.map((lib, index) => (
              <Accordion
                key={index}
                disableGutters
                elevation={0}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:before': { display: 'none' },
                  bgcolor: 'transparent',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Box>
                    <Typography variant="subtitle2">{lib.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Version: {lib.version} ({lib.license})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    {lib.text}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )
      case 'company':
        return (
          <>
            <Typography variant="h6" gutterBottom>
              {t('company')}
            </Typography>
            <Typography variant="body1" paragraph>
              CookWire is a modern web development playground designed to help developers build and experiment with web technologies efficiently.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Established in 2024.
            </Typography>
          </>
        )
      case 'privacy':
        return (
          <>
            <Typography variant="h6" gutterBottom>
              {t('privacy')}
            </Typography>
            <Typography variant="body2" paragraph>
              We value your privacy. Your code and projects are stored securely. We do not sell your personal data to third parties.
            </Typography>
            <Typography variant="body2" paragraph>
              We use standard web technologies to provide a seamless experience, including local storage and cloud synchronization if enabled.
            </Typography>
          </>
        )
      case 'terms':
        return (
          <>
            <Typography variant="h6" gutterBottom>
              {t('terms')}
            </Typography>
            <Typography variant="body2" paragraph>
              By using CookWire, you agree to use the platform for lawful purposes. You retain ownership of the code you create.
            </Typography>
            <Typography variant="body2" paragraph>
              We are not responsible for any data loss or issues resulting from the use of our platform. Use at your own risk.
            </Typography>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={type === 'oss' ? 'md' : 'sm'}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{t(type === 'oss' ? 'ossLicenses' : type)}</DialogTitle>
      <DialogContent dividers={type !== 'oss'}>
        <Box sx={{ py: 1 }}>{getContent()}</Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ borderRadius: 999, px: 3 }}>
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
})

export default InfoView
