import React, { useEffect, useState } from 'react';
import { HashRouter, BrowserRouter, Switch, Route, useHistory } from 'react-router-dom';
import { useTheme, IconButton } from '@mui/material';

import UserGenPage from './UserGenPage';
import MakerPage from './MakerPage';
import BookPage from './BookPage';
import OrderPage from './OrderPage';
import BottomBar from './BottomBar';
import { LearnDialog } from '../components/Dialogs';

import { apiClient } from '../services/api';
import checkVer from '../utils/checkVer';

import {
  Book,
  LimitList,
  Maker,
  Robot,
  Info,
  Settings,
  Favorites,
  defaultMaker,
  defaultRobot,
  defaultInfo,
} from '../models';

// Icons
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SchoolIcon from '@mui/icons-material/School';

const getWindowSize = function (fontSize: number) {
  // returns window size in EM units
  return {
    width: window.innerWidth / fontSize,
    height: window.innerHeight / fontSize,
  };
};

interface MainProps {
  updateTheme: () => void;
  settings: Settings;
  setSettings: (state: Settings) => void;
}

const Main = ({ settings, setSettings }: MainProps): JSX.Element => {
  const theme = useTheme();
  const history = useHistory();
  const Router = window.NativeRobosats != null ? HashRouter : BrowserRouter;
  const basename = window.NativeRobosats != null ? window.location.pathname : '';
  const [openLearn, setOpenLearn] = useState<boolean>(false);

  // All app data structured
  const [book, setBook] = useState<Book>({ orders: [], loading: true });
  const [limits, setLimits] = useState<{ list: LimitList; loading: boolean }>({
    list: [],
    loading: true,
  });
  const [robot, setRobot] = useState<Robot>(defaultRobot);
  const [maker, setMaker] = useState<Maker>(defaultMaker);
  const [info, setInfo] = useState<Info>(defaultInfo);
  const [fav, setFav] = useState<Favorites>({ type: null, currency: 0 });

  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    getWindowSize(theme.typography.fontSize),
  );

  useEffect(() => {
    if (typeof window !== undefined) {
      window.addEventListener('resize', onResize);
    }
    fetchBook();
    fetchLimits();
    fetchInfo();
    return () => {
      if (typeof window !== undefined) {
        window.removeEventListener('resize', onResize);
      }
    };
  }, []);

  const onResize = function () {
    setWindowSize(getWindowSize(theme.typography.fontSize));
  };

  const fetchBook = function () {
    setBook({ ...book, loading: true });
    apiClient.get('/api/book/').then((data: any) =>
      setBook({
        loading: false,
        orders: data.not_found ? [] : data,
      }),
    );
  };

  const fetchLimits = async () => {
    setLimits({ ...limits, loading: true });
    const data = apiClient.get('/api/limits/').then((data) => {
      setLimits({ list: data ?? [], loading: false });
      return data;
    });
    return await data;
  };

  const fetchInfo = function () {
    apiClient.get('/api/info/').then((data: any) => {
      const versionInfo: any = checkVer(data.version.major, data.version.minor, data.version.patch);
      setInfo({
        ...data,
        openUpdateClient: versionInfo.updateAvailable,
        coordinatorVersion: versionInfo.coordinatorVersion,
        clientVersion: versionInfo.clientVersion,
      });
      if (!robot.nickname && data.nickname) {
        setRobot({
          ...robot,
          nickname: data.nickname,
          loading: false,
          activeOrderId: data.active_order_id ?? null,
          lastOrderId: data.last_order_id ?? null,
          referralCode: data.referral_code,
          tgEnabled: data.tg_enabled,
          tgBotName: data.tg_bot_name,
          tgToken: data.tg_token,
          earnedRewards: data.earned_rewards ?? 0,
          stealthInvoices: data.wants_stealth,
        });
      }
    });
  };

  return (
    <Router basename={basename}>
      <div className='temporaryUpperIcons'>
        <LearnDialog open={openLearn} onClose={() => setOpenLearn(false)} />
        <IconButton
          color='inherit'
          sx={{ position: 'fixed', right: '34px', color: 'text.secondary' }}
          onClick={() => setOpenLearn(true)}
        >
          <SchoolIcon />
        </IconButton>
        <IconButton
          color='inherit'
          sx={{ position: 'fixed', right: '0px', color: 'text.secondary' }}
          onClick={() =>
            setSettings({ ...settings, mode: settings.mode === 'dark' ? 'light' : 'dark' })
          }
        >
          {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </div>
      <div className='appCenter'>
        <Switch>
          <Route
            exact
            path='/'
            render={(props: any) => (
              <UserGenPage match={props.match} theme={theme} robot={robot} setRobot={setRobot} />
            )}
          />
          <Route
            path='/ref/:refCode'
            render={(props: any) => (
              <UserGenPage match={props.match} theme={theme} robot={robot} setRobot={setRobot} />
            )}
          />
          <Route
            path='/make'
            render={() => (
              <MakerPage
                book={book}
                limits={limits}
                fetchLimits={fetchLimits}
                maker={maker}
                setMaker={setMaker}
                fav={fav}
                setFav={setFav}
                windowSize={windowSize}
              />
            )}
          />
          <Route
            path='/book'
            render={() => (
              <BookPage
                book={book}
                fetchBook={fetchBook}
                limits={limits}
                fetchLimits={fetchLimits}
                fav={fav}
                setFav={setFav}
                maker={maker}
                setMaker={setMaker}
                lastDayPremium={info.last_day_nonkyc_btc_premium}
                windowSize={windowSize}
              />
            )}
          />
          <Route
            path='/order/:orderId'
            render={(props: any) => <OrderPage theme={theme} history={history} {...props} />}
          />
        </Switch>
      </div>
      <div
        style={{
          height: '2.5em',
          position: 'fixed',
          bottom: 0,
        }}
      >
        <BottomBar
          theme={theme}
          windowSize={windowSize}
          redirectTo={(location: string) => history.push(location)}
          robot={robot}
          setRobot={setRobot}
          info={info}
          setInfo={setInfo}
          fetchInfo={fetchInfo}
        />
      </div>
    </Router>
  );
};

export default Main;
