"use client";

import { useState, useEffect } from "react";
import {
  fetchExecutedInvestments,
  emergencyWithdraw,
  takeInsurance,
} from "@/network/investments";
import { claimInsurance } from "@/network/insurance";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ShieldIcon from "@mui/icons-material/Shield";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import SecurityIcon from "@mui/icons-material/Security";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

const InsurancePage = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [takingInsuranceId, setTakingInsuranceId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [insuranceConfirmOpen, setInsuranceConfirmOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    setLoading(true);
    setError(null);

    try {
      const investmentsData = await fetchExecutedInvestments();
      console.log(
        "Loaded executed investments for insurance:",
        investmentsData
      );
      setInvestments(investmentsData);
    } catch (err) {
      console.error("Error loading investments:", err);
      setError("Failed to load your investments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const calculateLossPercentage = (currentValue, originalAmount) => {
    if (!currentValue || !originalAmount) return 0;
    return ((originalAmount - currentValue) / originalAmount) * 100;
  };

  const isEligibleForClaim = (investment) => {
    const lossPercentage = calculateLossPercentage(
      investment.current_value,
      investment.amount
    );
    console.log(
      `Investment ${investment.id} loss: ${lossPercentage}%, insurance claimed: ${investment.insurance_claimed}`
    );
    return lossPercentage >= 40 && !investment.insurance_claimed;
  };

  const isEligibleForWithdrawal = (investment) => {
    const lossPercentage = calculateLossPercentage(
      investment.current_value,
      investment.amount
    );
    return lossPercentage >= 10 && !investment.insurance_claimed;
  };

  const handleClaimInsurance = async (investment) => {
    setClaimingId(investment.id);
    setError(null);
    setSuccessMessage("");

    try {
      console.log(`Claiming insurance for investment ${investment.id}`);
      const result = await claimInsurance(investment.id);
      console.log("Claim result:", result);

      setSuccessMessage(
        `Successfully claimed insurance for ${
          investment.index?.name || "investment"
        }. ${result.amount} credits have been added to your account.`
      );

      // Update the local investment data
      setInvestments((prevInvestments) =>
        prevInvestments.map((inv) =>
          inv.id === investment.id ? { ...inv, insurance_claimed: true } : inv
        )
      );
    } catch (err) {
      console.error("Error claiming insurance:", err);
      setError(
        err.response?.data?.error ||
          "Failed to claim insurance. Please try again later."
      );
    } finally {
      setClaimingId(null);
    }
  };

  const openWithdrawConfirmation = (investment) => {
    setSelectedInvestment(investment);
    setWithdrawConfirmOpen(true);
  };

  const openInsuranceConfirmation = (investment) => {
    setSelectedInvestment(investment);
    setInsuranceConfirmOpen(true);
  };

  const handleEmergencyWithdraw = async () => {
    if (!selectedInvestment) return;

    setWithdrawConfirmOpen(false);
    setWithdrawingId(selectedInvestment.id);
    setError(null);
    setSuccessMessage("");

    try {
      console.log(
        `Processing emergency withdrawal for investment ${selectedInvestment.id}`
      );
      const result = await emergencyWithdraw(selectedInvestment.id);
      console.log("Withdrawal result:", result);

      setSuccessMessage(
        `Successfully withdrawn ${
          selectedInvestment.index?.name || "investment"
        }. ${result.withdrawn_amount} credits have been added to your account.`
      );

      // Remove the withdrawn investment from the list
      setInvestments((prevInvestments) =>
        prevInvestments.filter((inv) => inv.id !== selectedInvestment.id)
      );
    } catch (err) {
      console.error("Error processing withdrawal:", err);
      setError(
        err.response?.data?.error ||
          "Failed to process withdrawal. Please try again later."
      );
    } finally {
      setWithdrawingId(null);
      setSelectedInvestment(null);
    }
  };

  const handleTakeInsurance = async () => {
    if (!selectedInvestment) return;

    setInsuranceConfirmOpen(false);
    setTakingInsuranceId(selectedInvestment.id);
    setError(null);
    setSuccessMessage("");

    try {
      console.log(`Taking insurance for investment ${selectedInvestment.id}`);
      const result = await takeInsurance(selectedInvestment.id);
      console.log("Take insurance result:", result);

      setSuccessMessage(
        `Insurance taken successfully for ${
          selectedInvestment.index?.name || "investment"
        }. ${result.amount} credits have been added to your account.`
      );

      // Remove the investment from the list
      setInvestments((prevInvestments) =>
        prevInvestments.filter((inv) => inv.id !== selectedInvestment.id)
      );
    } catch (err) {
      console.error("Error taking insurance:", err);
      setError(
        err.response?.data?.error ||
          "Failed to take insurance. Please try again later."
      );
    } finally {
      setTakingInsuranceId(null);
      setSelectedInvestment(null);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "$0.00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numValue);
  };

  const getPerformanceColor = (originalAmount, currentValue) => {
    if (!originalAmount || !currentValue) return "gray";
    return currentValue >= originalAmount ? "success.main" : "error.main";
  };

  return (
    <div className="bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
            color="primary"
          >
            <ShieldIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Investment Protection
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Monitor your investments and protect them with our insurance
            program. Claim insurance for investments that have lost over 40% of
            their value, withdraw investments that have lost over 10%, or take
            insurance at any time to get your initial investment back.
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Box>

        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 3, fontWeight: "medium" }}
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : investments.length > 0 ? (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {investments.map((investment) => {
              const lossPercentage = calculateLossPercentage(
                investment.current_value,
                investment.amount
              );
              const eligible = isEligibleForClaim(investment);
              const withdrawEligible = isEligibleForWithdrawal(investment);
              const isPositive = investment.current_value >= investment.amount;

              // Progress value for LinearProgress
              const progressValue = Math.min(
                Math.max(100 - lossPercentage, 0),
                100
              );

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={6}
                  lg={4}
                  key={investment.id}
                  sx={{ display: "flex" }}
                >
                  <Card
                    elevation={3}
                    sx={{
                      borderRadius: 2,
                      borderLeft: eligible
                        ? "4px solid #2e7d32"
                        : withdrawEligible
                        ? "4px solid #ff9800"
                        : isPositive
                        ? "4px solid #2196f3"
                        : "none",
                      transition: "transform 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 6,
                      },
                      position: "relative",
                      overflow: "hidden",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            component="h2"
                            fontWeight="bold"
                          >
                            {investment.index?.name || "Investment"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Invested on{" "}
                            {new Date(
                              investment.investment_date
                            ).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <Chip
                            color={
                              investment.insurance_claimed
                                ? "secondary"
                                : eligible
                                ? "success"
                                : withdrawEligible
                                ? "warning"
                                : "default"
                            }
                            label={
                              investment.insurance_claimed
                                ? "Insurance Claimed"
                                : eligible
                                ? "Insurance Eligible"
                                : withdrawEligible
                                ? "Withdrawal Eligible"
                                : "Protected"
                            }
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Chip color="primary" label="EXECUTED" size="small" />
                        </Box>
                      </Box>

                      <Box sx={{ my: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progressValue}
                          color={
                            progressValue > 90
                              ? "success"
                              : progressValue > 60
                              ? "info"
                              : "error"
                          }
                          sx={{ height: 8, borderRadius: 5, mb: 1 }}
                        />

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" fontWeight="medium">
                            {isPositive ? (
                              <Box
                                component="span"
                                color="success.main"
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <ArrowUpwardIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5 }}
                                />
                                Profit: {formatCurrency(investment.profit_loss)}
                              </Box>
                            ) : (
                              <Box
                                component="span"
                                color="error.main"
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <ArrowDownwardIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5 }}
                                />
                                Loss:{" "}
                                {formatCurrency(
                                  Math.abs(investment.profit_loss)
                                )}
                              </Box>
                            )}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={getPerformanceColor(
                              investment.amount,
                              investment.current_value
                            )}
                          >
                            {isPositive ? "+" : ""}
                            {typeof investment.profit_loss_percentage ===
                            "number"
                              ? investment.profit_loss_percentage.toFixed(2)
                              : parseFloat(
                                  investment.profit_loss_percentage
                                ).toFixed(2)}
                            %
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 2,
                          p: 1.5,
                          bgcolor: "background.paper",
                          borderRadius: 1,
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Original Investment
                          </Typography>
                          <Typography variant="h6" fontWeight="medium">
                            {formatCurrency(investment.amount)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            align="right"
                            display="block"
                          >
                            Current Value
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="medium"
                            color={getPerformanceColor(
                              investment.amount,
                              investment.current_value
                            )}
                          >
                            {formatCurrency(investment.current_value)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions
                      sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
                    >
                      {eligible && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ShieldIcon />}
                          onClick={() => handleClaimInsurance(investment)}
                          disabled={claimingId === investment.id}
                          sx={{
                            flexGrow: 1,
                            mr: withdrawEligible ? 1 : 0,
                            fontWeight: "medium",
                          }}
                        >
                          {claimingId === investment.id
                            ? "Processing..."
                            : "Claim Insurance"}
                        </Button>
                      )}

                      {withdrawEligible && (
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<LocalAtmIcon />}
                          onClick={() => openWithdrawConfirmation(investment)}
                          disabled={withdrawingId === investment.id}
                          sx={{
                            flexGrow: 1,
                            ml: eligible ? 1 : 0,
                            fontWeight: "medium",
                          }}
                        >
                          {withdrawingId === investment.id
                            ? "Processing..."
                            : "Emergency Withdraw"}
                        </Button>
                      )}

                      {!investment.insurance_claimed && (
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<SecurityIcon />}
                          onClick={() => openInsuranceConfirmation(investment)}
                          disabled={takingInsuranceId === investment.id}
                          sx={{
                            flexGrow: 1,
                            fontWeight: "medium",
                            ml: eligible || withdrawEligible ? 1 : 0,
                          }}
                        >
                          {takingInsuranceId === investment.id
                            ? "Processing..."
                            : "Take Insurance"}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper
            elevation={2}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
            }}
          >
            <InfoIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No executed investments found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You currently don't have any executed investments to monitor.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/dashboard"
            >
              Explore Investment Opportunities
            </Button>
          </Paper>
        )}

        {/* Withdrawal Confirmation Dialog */}
        <Dialog
          open={withdrawConfirmOpen}
          onClose={() => setWithdrawConfirmOpen(false)}
          aria-labelledby="withdraw-dialog-title"
          aria-describedby="withdraw-dialog-description"
        >
          <DialogTitle id="withdraw-dialog-title">
            {"Confirm Emergency Withdrawal"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="withdraw-dialog-description">
              Are you sure you want to withdraw this investment early? You will
              receive{" "}
              {selectedInvestment &&
                formatCurrency(selectedInvestment.current_value)}{" "}
              as credits to your account, but the investment will be closed
              permanently.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setWithdrawConfirmOpen(false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmergencyWithdraw}
              color="warning"
              variant="contained"
              autoFocus
            >
              Confirm Withdrawal
            </Button>
          </DialogActions>
        </Dialog>

        {/* Insurance Confirmation Dialog */}
        <Dialog
          open={insuranceConfirmOpen}
          onClose={() => setInsuranceConfirmOpen(false)}
          aria-labelledby="insurance-dialog-title"
          aria-describedby="insurance-dialog-description"
        >
          <DialogTitle id="insurance-dialog-title">
            {"Confirm Insurance Claim"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="insurance-dialog-description">
              Are you sure you want to take insurance for this investment? You
              will receive{" "}
              {selectedInvestment && formatCurrency(selectedInvestment.amount)}{" "}
              as credits to your account (your original investment amount), but
              the investment will be closed permanently.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setInsuranceConfirmOpen(false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTakeInsurance}
              color="primary"
              variant="contained"
              autoFocus
            >
              Confirm Insurance
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default InsurancePage;
