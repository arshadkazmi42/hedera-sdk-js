import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import AccountId from "./AccountId.js";
import TokenId from "../token/TokenId.js";
import NftId from "../token/NftId.js";
import HbarAllowance from "./HbarAllowance.js";
import TokenAllowance from "./TokenAllowance.js";
import TokenNftAllowance from "./TokenNftAllowance.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HashgraphProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HashgraphProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HashgraphProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HashgraphProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HashgraphProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ICryptoDeleteAllowanceTransactionBody} HashgraphProto.proto.ICryptoDeleteAllowanceTransactionBody
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HashgraphProto.proto.IAccountID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("../long.js").LongObject} LongObject
 */

/**
 * Change properties for the given account.
 */
export default class AccountAllowanceDeleteTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {HbarAllowance[]} [props.hbarAllowances]
     * @param {TokenAllowance[]} [props.tokenAllowances]
     * @param {TokenNftAllowance[]} [props.nftAllowances]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {HbarAllowance[]}
         */
        this._hbarAllowances =
            props.hbarAllowances != null ? props.hbarAllowances : [];

        /**
         * @private
         * @type {TokenAllowance[]}
         */
        this._tokenAllowances =
            props.tokenAllowances != null ? props.tokenAllowances : [];

        /**
         * @private
         * @type {TokenNftAllowance[]}
         */
        this._nftAllowances =
            props.nftAllowances != null ? props.nftAllowances : [];
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.ITransaction[]} transactions
     * @param {HashgraphProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HashgraphProto.proto.ITransactionBody[]} bodies
     * @returns {AccountAllowanceDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const allowance =
            /** @type {HashgraphProto.proto.ICryptoDeleteAllowanceTransactionBody} */ (
                body.cryptoDeleteAllowance
            );

        return Transaction._fromProtobufTransactions(
            new AccountAllowanceDeleteTransaction({
                hbarAllowances: (allowance.cryptoAllowances != null
                    ? allowance.cryptoAllowances
                    : []
                ).map((allowance) => HbarAllowance._fromProtobuf(allowance)),
                tokenAllowances: (allowance.tokenAllowances != null
                    ? allowance.tokenAllowances
                    : []
                ).map((allowance) => TokenAllowance._fromProtobuf(allowance)),
                nftAllowances: (allowance.nftAllowances != null
                    ? allowance.nftAllowances
                    : []
                ).map((allowance) =>
                    TokenNftAllowance._fromProtobuf(allowance)
                ),
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
    }

    /**
     * @returns {HbarAllowance[]}
     */
    get hbarAllowances() {
        return this._hbarAllowances;
    }

    /**
     * @param {AccountId | string} ownerAccountId
     * @returns {AccountAllowanceDeleteTransaction}
     */
    deleteAllHbarAllowances(ownerAccountId) {
        this._hbarAllowances.push(
            new HbarAllowance({
                spenderAccountId: null,
                ownerAccountId:
                    typeof ownerAccountId === "string"
                        ? AccountId.fromString(ownerAccountId)
                        : ownerAccountId,
                amount: null,
            })
        );

        return this;
    }

    /**
     * @returns {TokenAllowance[]}
     */
    get tokenAllowances() {
        return this._tokenAllowances;
    }

    /**
     * @param {TokenId | string} tokenId
     * @param {AccountId | string} ownerAccountId
     * @returns {AccountAllowanceDeleteTransaction}
     */
    deleteAllTokenAllowances(tokenId, ownerAccountId) {
        this._requireNotFrozen();

        this._tokenAllowances.push(
            new TokenAllowance({
                tokenId:
                    typeof tokenId === "string"
                        ? TokenId.fromString(tokenId)
                        : tokenId,
                spenderAccountId: null,
                ownerAccountId:
                    typeof ownerAccountId === "string"
                        ? AccountId.fromString(ownerAccountId)
                        : ownerAccountId,
                amount: null,
            })
        );

        return this;
    }

    /**
     * @param {NftId | string} nftId
     * @param {AccountId | string} ownerAccountId
     * @returns {AccountAllowanceDeleteTransaction}
     */
    deleteAllTokenNftAllowances(nftId, ownerAccountId) {
        this._requireNotFrozen();

        const id = typeof nftId === "string" ? NftId.fromString(nftId) : nftId;

        const owner =
            typeof ownerAccountId === "string"
                ? AccountId.fromString(ownerAccountId)
                : ownerAccountId;
        let found = false;

        for (const allowance of this._nftAllowances) {
            if (allowance.tokenId.compare(id.tokenId) === 0) {
                if (allowance.serialNumbers != null) {
                    allowance.serialNumbers.push(id.serial);
                }
                found = true;
                break;
            }
        }

        if (!found) {
            this._nftAllowances.push(
                new TokenNftAllowance({
                    tokenId: id.tokenId,
                    spenderAccountId: null,
                    serialNumbers: [id.serial],
                    ownerAccountId: owner,
                    allSerials: false,
                })
            );
        }

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        this._hbarAllowances.map((allowance) =>
            allowance._validateChecksums(client)
        );
        this._tokenAllowances.map((allowance) =>
            allowance._validateChecksums(client)
        );
        this._nftAllowances.map((allowance) =>
            allowance._validateChecksums(client)
        );
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HashgraphProto.proto.ITransaction} request
     * @returns {Promise<HashgraphProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.deleteAllowances(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HashgraphProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoDeleteAllowance";
    }

    /**
     * @override
     * @protected
     * @returns {HashgraphProto.proto.ICryptoDeleteAllowanceTransactionBody}
     */
    _makeTransactionData() {
        return {
            cryptoAllowances: this._hbarAllowances.map((allowance) =>
                allowance._toProtobuf()
            ),
            tokenAllowances: this._tokenAllowances.map((allowance) =>
                allowance._toProtobuf()
            ),
            nftAllowances: this._nftAllowances.map((allowance) =>
                allowance._toProtobuf()
            ),
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `AccountAllowanceDeleteTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoDeleteAllowance",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountAllowanceDeleteTransaction._fromProtobuf
);
