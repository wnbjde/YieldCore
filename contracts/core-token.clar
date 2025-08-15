;; YieldCore Core Token Contract
;; Clarity version: 2 (assuming latest as of 2025)
;; Implements SIP-010 fungible token trait for compatibility with Stacks ecosystem
;; Includes minting with inflation control, burning, transfers with allowances (approve/transfer-from)
;; Staking mechanism for governance and rewards eligibility
;; Admin controls, pausing, and robust error handling
;; Sophisticated features: delegation for staking, token URI, event emissions via print

;; Error constants for robust error handling
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INSUFFICIENT-BALANCE u101)
(define-constant ERR-INSUFFICIENT-STAKE u102)
(define-constant ERR-INSUFFICIENT-ALLOWANCE u103)
(define-constant ERR-MAX-SUPPLY-REACHED u104)
(define-constant ERR-PAUSED u105)
(define-constant ERR-ZERO-ADDRESS u106)
(define-constant ERR-ZERO-AMOUNT u107)
(define-constant ERR-INVALID-DELEGATE u108)
(define-constant ERR-ALREADY-DELEGATED u109)

;; Token metadata constants
(define-constant TOKEN-NAME "YieldCore Token")
(define-constant TOKEN-SYMBOL "YCORE")
(define-constant TOKEN-DECIMALS u6)
(define-constant MAX-SUPPLY u100000000000000) ;; 100M tokens with decimals (u6, so 100M * 10^6 = 1e14 micro-units)
(define-constant TOKEN-URI (some u"https://yieldcore.example/token-metadata.json")) ;; Optional URI for token info

;; Contract state variables
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var total-supply uint u0)
(define-data-var mint-cap uint MAX-SUPPLY) ;; Dynamic cap for inflation control, starts at max

;; Maps for balances, allowances, stakes, and delegations
(define-map balances principal uint)
(define-map allowances { owner: principal, spender: principal } uint)
(define-map staked-balances principal uint)
(define-map delegated-stakes { delegator: principal, delegatee: principal } uint) ;; Allows delegation of staked voting power

;; Trait definition for SIP-010 fungible token (for interoperability)
(define-trait fungible-token
  (
    (transfer (principal uint (optional (buff 34))) (response bool uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 32) uint))
    (get-decimals () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)

;; Private helper: Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: Ensure contract is not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: Ensure amount is positive
(define-private (ensure-positive-amount (amount uint))
  (asserts! (> amount u0) (err ERR-ZERO-AMOUNT))
)

;; Private helper: Ensure valid principal (not zero address)
(define-private (ensure-valid-principal (addr principal))
  (asserts! (not (is-eq addr 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
)

;; Event emitter: Print events for off-chain indexing
(define-private (emit-event (event-type (string-ascii 32)) (data (tuple (key (string-ascii 32)) (value uint))))
  (print { type: event-type, data: data })
)

;; Transfer admin rights to a new admin
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ensure-valid-principal new-admin)
    (var-set admin new-admin)
    (emit-event "admin-transfer" (tuple (key "new-admin") (value u0))) ;; Value unused here
    (ok true)
  )
)

;; Pause or unpause the contract (affects transfers, stakes, etc.)
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (emit-event "pause-status" (tuple (key "paused") (value (if pause u1 u0))))
    (ok pause)
  )
)

;; Update mint cap for inflation control (admin only, can reduce cap)
(define-public (update-mint-cap (new-cap uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= new-cap MAX-SUPPLY) (err ERR-MAX-SUPPLY-REACHED))
    (asserts! (<= new-cap (var-get mint-cap)) (err ERR-NOT-AUTHORIZED)) ;; Can only decrease
    (var-set mint-cap new-cap)
    (emit-event "mint-cap-update" (tuple (key "new-cap") (value new-cap)))
    (ok new-cap)
  )
)

;; Mint new tokens (admin only, respects mint-cap)
(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (ensure-valid-principal recipient)
    (ensure-positive-amount amount)
    (let ((new-supply (+ (var-get total-supply) amount)))
      (asserts! (<= new-supply (var-get mint-cap)) (err ERR-MAX-SUPPLY-REACHED))
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (var-set total-supply new-supply)
      (emit-event "mint" (tuple (key "amount") (value amount)))
      (ok amount)
    )
  )
)

;; Burn tokens from caller's balance
(define-public (burn (amount uint))
  (begin
    (ensure-not-paused)
    (ensure-positive-amount amount)
    (let ((balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- balance amount))
      (var-set total-supply (- (var-get total-supply) amount))
      (emit-event "burn" (tuple (key "amount") (value amount)))
      (ok amount)
    )
  )
)

;; Approve spender to transfer allowance
(define-public (approve (spender principal) (amount uint))
  (begin
    (ensure-not-paused)
    (ensure-valid-principal spender)
    (map-set allowances { owner: tx-sender, spender: spender } amount)
    (emit-event "approval" (tuple (key "amount") (value amount)))
    (ok amount)
  )
)

;; Increase allowance for spender
(define-public (increase-allowance (spender principal) (added uint))
  (begin
    (ensure-not-paused)
    (ensure-valid-principal spender)
    (ensure-positive-amount added)
    (let ((current (default-to u0 (map-get? allowances { owner: tx-sender, spender: spender }))))
      (map-set allowances { owner: tx-sender, spender: spender } (+ current added))
      (emit-event "increase-allowance" (tuple (key "added") (value added)))
      (ok (+ current added))
    )
  )
)

;; Decrease allowance for spender
(define-public (decrease-allowance (spender principal) (subtracted uint))
  (begin
    (ensure-not-paused)
    (ensure-valid-principal spender)
    (ensure-positive-amount subtracted)
    (let ((current (default-to u0 (map-get? allowances { owner: tx-sender, spender: spender }))))
      (asserts! (>= current subtracted) (err ERR-INSUFFICIENT-ALLOWANCE))
      (map-set allowances { owner: tx-sender, spender: spender } (- current subtracted))
      (emit-event "decrease-allowance" (tuple (key "subtracted") (value subtracted)))
      (ok (- current subtracted))
    )
  )
)

;; Transfer tokens (direct, no allowance needed)
(define-public (transfer (recipient principal) (amount uint))
  (begin
    (ensure-not-paused)
    (ensure-valid-principal recipient)
    (ensure-positive-amount amount)
    (let ((sender-balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= sender-balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- sender-balance amount))
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (emit-event "transfer" (tuple (key "amount") (value amount)))
      (ok amount)
    )
  )
)

;; Transfer from (using allowance)
(define-public (transfer-from (owner principal) (recipient principal) (amount uint))
  (begin
    (ensure-not-paused)
    (ensure-valid-principal owner)
    (ensure-valid-principal recipient)
    (ensure-positive-amount amount)
    (let ((allowance (default-to u0 (map-get? allowances { owner: owner, spender: tx-sender })))
          (owner-balance (default-to u0 (map-get? balances owner))))
      (asserts! (>= allowance amount) (err ERR-INSUFFICIENT-ALLOWANCE))
      (asserts! (>= owner-balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set allowances { owner: owner, spender: tx-sender } (- allowance amount))
      (map-set balances owner (- owner-balance amount))
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (emit-event "transfer-from" (tuple (key "amount") (value amount)))
      (ok amount)
    )
  )
)

;; Stake tokens for governance/rewards
(define-public (stake (amount uint))
  (begin
    (ensure-not-paused)
    (ensure-positive-amount amount)
    (let ((balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- balance amount))
      (map-set staked-balances tx-sender (+ amount (default-to u0 (map-get? staked-balances tx-sender))))
      (emit-event "stake" (tuple (key "amount") (value amount)))
      (ok amount)
    )
  )
)

;; Unstake tokens
(define-public (unstake (amount uint))
  (begin
    (ensure-not-paused)
    (ensure-positive-amount amount)
    (let ((staked (default-to u0 (map-get? staked-balances tx-sender))))
      (asserts! (>= staked amount) (err ERR-INSUFFICIENT-STAKE))
      (map-set staked-balances tx-sender (- staked amount))
      (map-set balances tx-sender (+ amount (default-to u0 (map-get? balances tx-sender))))
      (emit-event "unstake" (tuple (key "amount") (value amount)))
      (ok amount)
    )
  )
)

;; Delegate staked voting power to another principal
(define-public (delegate-stake (delegatee principal) (amount uint))
  (begin
    (ensure-not-paused)
    (ensure-valid-principal delegatee)
    (ensure-positive-amount amount)
    (let ((staked (default-to u0 (map-get? staked-balances tx-sender))))
      (asserts! (>= staked amount) (err ERR-INSUFFICIENT-STAKE))
      (asserts! (is-none (map-get? delegated-stakes { delegator: tx-sender, delegatee: delegatee })) (err ERR-ALREADY-DELEGATED))
      (map-set delegated-stakes { delegator: tx-sender, delegatee: delegatee } amount)
      (emit-event "delegate-stake" (tuple (key "amount") (value amount)))
      (ok amount)
    )
  )
)

;; Revoke delegation
(define-public (revoke-delegation (delegatee principal))
  (begin
    (ensure-not-paused)
    (ensure-valid-principal delegatee)
    (let ((delegated (map-get? delegated-stakes { delegator: tx-sender, delegatee: delegatee })))
      (asserts! (is-some delegated) (err ERR-INVALID-DELEGATE))
      (map-delete delegated-stakes { delegator: tx-sender, delegatee: delegatee })
      (emit-event "revoke-delegation" (tuple (key "amount") (value (unwrap-panic delegated))))
      (ok true)
    )
  )
)

;; Read-only: Get balance of an account
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account)))
)

;; Read-only: Get staked balance of an account
(define-read-only (get-staked-balance (account principal))
  (ok (default-to u0 (map-get? staked-balances account)))
)

;; Read-only: Get delegated stake from delegator to delegatee
(define-read-only (get-delegated-stake (delegator principal) (delegatee principal))
  (ok (default-to u0 (map-get? delegated-stakes { delegator: delegator, delegatee: delegatee })))
)

;; Read-only: Get allowance
(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (default-to u0 (map-get? allowances { owner: owner, spender: spender })))
)

;; Read-only: Get total supply
(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; Read-only: Get name
(define-read-only (get-name)
  (ok TOKEN-NAME)
)

;; Read-only: Get symbol
(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

;; Read-only: Get decimals
(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

;; Read-only: Get token URI
(define-read-only (get-token-uri)
  (ok TOKEN-URI)
)

;; Read-only: Get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: Is paused
(define-read-only (is-paused)
  (ok (var-get paused))
)

;; Read-only: Get current mint cap
(define-read-only (get-mint-cap)
  (ok (var-get mint-cap))
)

;; SIP-010 transfer function (with memo)
(define-public (sip-transfer (recipient principal) (amount uint) (memo (optional (buff 34))))
  (begin
    (try! (transfer recipient amount))
    (match memo m (print { memo: m }) true)
    (ok true)
  )
)

;; Implement the fungible-token trait
(define-public (get-balance-sip (account principal))
  (get-balance account)
)

(define-public (get-total-supply-sip)
  (get-total-supply)
)

(define-public (get-name-sip)
  (get-name)
)

(define-public (get-symbol-sip)
  (get-symbol)
)

(define-public (get-decimals-sip)
  (get-decimals)
)

(define-public (get-token-uri-sip)
  (get-token-uri)
)