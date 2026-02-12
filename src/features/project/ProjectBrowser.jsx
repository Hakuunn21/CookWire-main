import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'

export default function ProjectBrowser({ open, onClose, projects, loading, error, onReload, onLoadProject, t }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('projectListTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onReload} disabled={loading}>Reload</Button>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <List sx={{ p: 0 }}>
          {projects.length === 0 && !loading ? (
            <ListItem>
              <ListItemText primary={t('noProjects')} />
            </ListItem>
          ) : null}

          {projects.map((project) => (
            <ListItem
              key={project.id}
              sx={(theme) => ({
                mb: 1,
                borderRadius: 4,
                backgroundColor: theme.custom.surfaceContainer,
              })}
              secondaryAction={
                <Button variant="contained" color="primary" onClick={() => onLoadProject(project.id)}>
                  {t('load')}
                </Button>
              }
            >
              <ListItemText
                primary={project.title}
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {t('createdAt')}: {new Date(project.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('updatedAt')}: {new Date(project.updatedAt).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}
