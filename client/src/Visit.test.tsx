// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { setIconOptions, Spinner } from '@fluentui/react';
import { CommunicationUserToken } from '@azure/communication-identity';
import { mount } from 'enzyme';
import { generateTheme } from './utils/ThemeGenerator';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Visit } from './Visit';
import { AppConfigModel } from './models/ConfigModel';
import { Header } from './Header';
import { act } from '@testing-library/react';
import { fetchConfig } from './utils/FetchConfig';
import { JoinTeamsMeeting } from './components/JoinTeamsMeeting';
import { MeetingExperience } from './components/MeetingExperience';
import { getTeamsMeetingLink } from './utils/GetTeamsMeetingLink';

const MOCK_VALID_TEAMSMEETINGLINKMODEL = getTeamsMeetingLink(
  '?meetingURL=https%3A%2F%2Fteams.microsoft.com%2Fl%2Fmeetup-join%2F19%253ameeting_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA%2540thread.v2%2F0%3Fcontext%3D%257b%2522Tid%2522%253a%252200000000-0000-0000-0000-000000000000%2522%252c%2522Oid%2522%253a%252200000000-0000-0000-0000-000000000000%2522%257d'
);

configure({ adapter: new Adapter() });

// Disable icon warnings for tests as we don't register the icons for unit tests which causes warnings.
// See: https://github.com/microsoft/fluentui/wiki/Using-icons#test-scenarios
setIconOptions({
  disableWarnings: true
});

jest.mock('./utils/FetchConfig', () => {
  return {
    fetchConfig: jest.fn()
  };
});

jest.mock('./utils/FetchToken', () => {
  return {
    fetchToken: (): Promise<CommunicationUserToken> => {
      return Promise.resolve({
        user: { communicationUserId: 'userId' },
        token: 'token',
        expiresOn: new Date()
      });
    }
  };
});

jest.mock('./components/MeetingExperience');

describe('Visit', () => {
  beforeEach(() => {
    //remove console.error logs in tests
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('should render loading spinner when config is not loaded', async () => {
    (fetchConfig as jest.Mock).mockImplementation(
      async (): Promise<AppConfigModel | undefined> => {
        return Promise.resolve(undefined);
      }
    );

    const visit = await mount(<Visit />);

    await act(async () => {
      jest.useFakeTimers();
      jest.runAllTimers();
    });

    visit.update();

    const spinners = visit.find(Spinner);
    const headers = visit.find(Header);

    expect(spinners.length).toBe(1);
    expect(headers.length).toBe(0);
  });

  it('renders an generic error UI when config throws an error', async () => {
    (fetchConfig as jest.Mock).mockImplementation(
      async (): Promise<AppConfigModel | undefined> => {
        throw new Error('test error');
      }
    );

    const visit = await mount(<Visit />);

    await act(async () => {
      jest.useFakeTimers();
      jest.runAllTimers();
    });

    visit.update();

    const genericErrorUI = visit.find('#generic-error');

    expect(genericErrorUI.length).toBe(1);
  });

  it('should render JoinTeamsMeeting when config is loaded but the meeting link is not set', async () => {
    (fetchConfig as jest.Mock).mockImplementation(
      async (): Promise<AppConfigModel | undefined> => {
        return Promise.resolve({
          communicationEndpoint: 'enpoint=test_endpoint;',
          microsoftBookingsUrl: '',
          chatEnabled: true,
          screenShareEnabled: true,
          companyName: '',
          theme: generateTheme('#FFFFFF'),
          waitingTitle: '',
          waitingSubtitle: '',
          logoUrl: ''
        });
      }
    );

    const visit = await mount(<Visit />);

    await act(async () => {
      jest.useFakeTimers();
      jest.runAllTimers();
    });

    await visit.update();

    const spinners = visit.find(Spinner);
    const genericErrorUI = visit.find('#generic-error');
    const joinMeetings = visit.find(JoinTeamsMeeting);

    expect(spinners.length).toBe(0);
    expect(genericErrorUI.length).toBe(0);
    expect(joinMeetings.length).toBe(1);
  });

  it('should render MeetingExperience when config and token are loaded and meeting link is set', async () => {
    (fetchConfig as jest.Mock).mockImplementation(
      async (): Promise<AppConfigModel | undefined> => {
        return Promise.resolve({
          communicationEndpoint: 'enpoint=test_endpoint;',
          microsoftBookingsUrl: '',
          chatEnabled: true,
          screenShareEnabled: true,
          companyName: '',
          theme: generateTheme('#FFFFFF'),
          waitingTitle: '',
          waitingSubtitle: '',
          logoUrl: ''
        });
      }
    );

    const visit = await mount(<Visit />);

    visit.setState({ meetingLinkModel: MOCK_VALID_TEAMSMEETINGLINKMODEL });

    await act(async () => {
      jest.useFakeTimers();
      jest.runAllTimers();
    });

    await visit.update();

    const spinners = visit.find(Spinner);
    const meetingExperiences = visit.find(MeetingExperience);

    expect(spinners.length).toBe(0);
    expect(meetingExperiences.length).toBe(1);
  });
});
