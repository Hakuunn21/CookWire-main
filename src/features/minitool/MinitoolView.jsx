import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

export default function MinitoolView({ open, onClose, t }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ px: 2, py: 1.5 }}>
        <Typography variant="headlineSmall">{t('minitool')}</Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 2 }}>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="bodyLarge" color="text.secondary">
            Minitool機能は準備中です
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} variant="text">
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
