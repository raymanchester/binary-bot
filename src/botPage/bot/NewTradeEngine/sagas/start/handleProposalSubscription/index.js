import { call, fork, select, put } from 'redux-saga/effects';
import * as actions from '../../../constants/actions';
import * as selectors from '../../selectors';
import dataStream from '../../dataStream';
import requestProposals from './requestProposals';
import handleProposalReady from './handleProposalReady';
import handleProposalStream from './handleProposalStream';
import handleForgottenProposal from './handleForgottenProposal';

export default function* handleProposalSubscription({ proposalRequests, $scope }) {
    const receivedProposals = yield select(selectors.receivedProposals);
    const receivedProposalsPayload = Object.values(receivedProposals);

    for (let i = 0; i < receivedProposalsPayload.length; i++) {
        yield fork(handleForgottenProposal, { $scope, proposal: receivedProposalsPayload[i] });
    }
    try {
        for (let i = 0; i < proposalRequests.length; i++) {
            yield put({ type: `UPDATE_${actions.REQUESTED_PROPOSAL}`, payload: { [proposalRequests[i].uuid]: true } });
        }
        yield call(requestProposals, { proposalRequests, $scope });
        const channel = yield call(dataStream, { type: 'proposal', $scope });
        yield fork(handleProposalStream, channel);
        yield fork(handleProposalReady);
    } catch (error) {
        yield put({ type: 'RECEIVE_PROPOSAL_ERROR', payload: error, error: true });
    }
}
