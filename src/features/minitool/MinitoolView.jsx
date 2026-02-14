import { Box, Typography, Dialog, DialogContent, DialogActions, Button } from '@mui/material'
import { BuildRounded } from '@mui/icons-material'

export default function MinitoolView({ open, onClose, t }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3, // Match Settings
          textAlign: 'center',
          p: 1
        },
      }}
    >
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
        <BuildRounded sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
        <Typography variant="h4" component="h2" gutterBottom fontWeight="700">
          Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Minitool features are currently under development.
          <br />
          Stay tuned for updates!
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} color="primary" variant="text">
          {t('close') || 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
