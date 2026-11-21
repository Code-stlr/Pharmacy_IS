import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useTranslation } from "react-i18next";
import { type api, ApiError, type RecordData } from "./api";
import RecordList from "./RecordList";

export default function PatientHistory({
  patientId,
  callApi,
  onClose,
}: {
  patientId: number;
  callApi: typeof api;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<{
    patient: RecordData;
    prescriptions: RecordData[];
    dispensings: RecordData[];
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      callApi(`patients/${patientId}/`),
      callApi(`prescriptions/?patient=${patientId}`),
      callApi(`dispensings/?patient=${patientId}`),
    ])
      .then(([patient, prescriptions, dispensings]) => {
        if (active) setHistory({ patient, prescriptions, dispensings });
      })
      .catch((reason) => {
        if (active) setError(reason instanceof ApiError ? reason.code : "error");
      });
    return () => { active = false; };
  }, [patientId, callApi]);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg" aria-labelledby="patient-history-title">
      <DialogTitle id="patient-history-title">{t("patientHistory")}</DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error">{t(error, { defaultValue: t("error") })}</Alert>
        ) : history ? (
          <>
            <h2>{history.patient.full_name} · {history.patient.reference}</h2>
            <p>
              <strong>{t("allergies")}</strong> · {history.patient.allergy_names?.join(", ") || t("none")}
            </p>
            {history.patient.allergy_notes && <p>{history.patient.allergy_notes}</p>}
            <h3>{t("prescriptions")}</h3>
            <RecordList resource="prescriptions" rows={history.prescriptions} data={{}} />
            <h3>{t("dispensings")}</h3>
            <RecordList resource="dispensings" rows={history.dispensings} data={{}} />
          </>
        ) : (
          <p role="status">{t("loading")}</p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("closeHistory")}</Button>
      </DialogActions>
    </Dialog>
  );
}
