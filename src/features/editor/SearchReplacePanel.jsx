import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'

export default function SearchReplacePanel({
  open,
  onClose,
  query,
  replaceValue,
  caseSensitive,
  onChangeQuery,
  onChangeReplace,
  onToggleCase,
  onFindNext,
  onReplaceNext,
  onReplaceAll,
  matches,
  t,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('searchReplace')}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1.5, pt: '12px !important' }}>
        <TextField label={t('query')} value={query} onChange={(event) => onChangeQuery(event.target.value)} autoFocus />
        <TextField label={t('replaceWith')} value={replaceValue} onChange={(event) => onChangeReplace(event.target.value)} />
        <FormControlLabel
          control={<Checkbox checked={caseSensitive} onChange={(event) => onToggleCase(event.target.checked)} />}
          label={t('caseSensitive')}
        />
        <Box>
          <Typography variant="labelSmall" color="text.secondary">
            {matches > 0 ? `${matches} ${t('matches')}` : t('noMatches')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onFindNext}>{t('findNext')}</Button>
        <Button onClick={onReplaceNext}>{t('replaceNext')}</Button>
        <Button onClick={onReplaceAll} variant="contained" color="primary">
          {t('replaceAll')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
