import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, AppBar, Box, Button, Container, MenuItem, Paper, Stack, TextField, Toolbar, Typography } from '@mui/material'
import { languages } from './i18n'

export default function App() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<'checking' | 'ready' | 'offline'>('checking')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setStatus('checking')
    fetch('/api/health/', { signal: controller.signal }).then(async response => {
      const body = await response.json()
      if (!response.ok || body.status !== 'ok') throw new Error('Unavailable')
      setStatus('ready')
    }).catch(() => { if (!controller.signal.aborted) setStatus('offline') })
    return () => controller.abort()
  }, [attempt])
  useEffect(() => { document.documentElement.lang = i18n.language }, [i18n.language])
  return <>
    <AppBar position="static"><Toolbar><Typography variant="h6" sx={{ flexGrow: 1 }}>{t('title')}</Typography></Toolbar></AppBar>
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box><Typography variant="h3" component="h1">{t('title')}</Typography><Typography color="text.secondary">{t('subtitle')}</Typography></Box>
        <TextField select label={t('language')} value={i18n.language} onChange={event => void i18n.changeLanguage(event.target.value)} sx={{ width: 180 }}>{Object.entries(languages).map(([code, label]) => <MenuItem key={code} value={code}>{label}</MenuItem>)}</TextField>
        <Paper sx={{ p: { xs: 2, sm: 4 } }}><Stack spacing={2}>
          <Typography variant="h5" component="h2">{t('heading')}</Typography>
          <Typography>{t('description')}</Typography>
          <Alert role="status" severity={status === 'ready' ? 'success' : status === 'offline' ? 'error' : 'info'}>{t(status)}</Alert>
          <Button disabled={status === 'checking'} onClick={() => setAttempt(value => value + 1)}>{t('retry')}</Button>
        </Stack></Paper>
      </Stack>
    </Container>
  </>
}

