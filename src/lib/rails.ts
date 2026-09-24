import { ApiError, api } from './api'

/**
 * Client for the payment-rail endpoints.
 *
 * Deliberately thin: it carries the payer's own wallet number and one-time
 * authorisation to our API and reads back a state. It knows no provider, holds
 * no merchant credential, and could not obtain one — every call that needs a
 * merchant secret happens on the server.
 */

/** The states a rail call can resolve to, as the API reports them. */
export type RailState =
  | 'authorized'
  | 'captured'
  | 'pending'
  | 'released'
  | 'refunded'
  | 'failed'
  | 'unsupported'

export interface RailResult {
  state: RailState
  provider: string
  message?: string
  status?: string
}

export interface RailStatus {
  status: string
  reference: string
  /** True while the payer still has to approve on their handset. */
  awaitingPayer: boolean
  provider: string | null
  providerState: RailResult | null
}

/** Thrown when no rail is configured, so the caller can fall back. */
export class RailUnavailableError extends Error {}

function rethrow(err: unknown): never {
  if (err instanceof ApiError && err.code === 'rail_unavailable') {
    throw new RailUnavailableError(err.message)
  }
  throw err
}

export async function authorizeRail(
  transferId: string,
  input: { password: string; payerAccountNo: string; payerAccountPin?: string },
): Promise<RailResult> {
  try {
    return await api.post<RailResult>(`/transfers/${transferId}/rail/authorize`, input)
  } catch (err) {
    rethrow(err)
  }
}

export async function captureRail(transferId: string, password: string): Promise<RailResult> {
  try {
    return await api.post<RailResult>(`/transfers/${transferId}/rail/capture`, { password })
  } catch (err) {
    rethrow(err)
  }
}

export async function railStatus(transferId: string): Promise<RailStatus> {
  return await api.get<RailStatus>(`/transfers/${transferId}/rail/status`)
}
