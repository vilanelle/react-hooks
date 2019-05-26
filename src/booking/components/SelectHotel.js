// eslint disable no-unused-var
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Grid, Loader, Container } from 'semantic-ui-react';

import Filters from './Filters';
import SortBar from './SortBar';
import HotelsList from './HotelsList';
import ChartSwitcher from './ChartSwitcher';
import RatingChart from './RatingChart';

import { ONLINE_URL, BEDS_TYPE } from '../../utils/const';

const SelectHotel = props => {
  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('price');
  const [isChartVisible, setChartVisible] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    fetch(ONLINE_URL)
      .then(response => response.json())
      .then(data => {
        setHotels(data.list.slice(0,10)); // set hotels in state
        setChartData(prepareChartData(data.list.slice(0,10))); // set chart data
        setIsLoading(false);
      });
  }, []); // empty array because we only run once 

  const handleSetFilters = useCallback((v, checked) => {
    setFilters(prevState => ({...prevState, [v]: checked}));
  }, []);

  const filteredHotels = useMemo(() => {
    return applyFilter(filters, hotels);
  }, [filters, hotels]);

  const displayedHotels = useMemo(() => {
    return applySort(filteredHotels, sortField);
  }, [filteredHotels, sortField]);

  const handleSort = field => setSortField(field);

  function toggleChartVisibility(chartVisible) {
    setChartVisible(chartVisible);
  }
  const hotelCount = useMemo(() => {
    return countHotelsByBedType(displayedHotels);
  }, [displayedHotels]);

  return (
    <Container>
      <SortBar sortField={sortField} setField={handleSort} />
      <Layout>
        <Layout.Sidebar>
          <ChartSwitcher isChartVisible={isChartVisible} switchChartVisible={toggleChartVisibility} />
          <Filters count={hotelCount} onChange={handleSetFilters} />
        </Layout.Sidebar>
        <Layout.Feed isLoading={isLoading}>
          {isLoading ? (
            <Loader active inline="centered" />
            ) : (
              <React.Fragment>
              {isChartVisible && <RatingChart data={chartData} />}
              <HotelsList hotels={displayedHotels} selectHotel={noop} />
              </React.Fragment>
          )}
        </Layout.Feed>
      </Layout>
    </Container>
  );
};

const noop = () => {};


function countHotelsByBedType(data) {
  return data.reduce(function(acc, v) {
    acc[v.room] = acc[v.room] ? acc[v.room] + 1 : 1;
    return acc;
  }, {});
}

function applyFilter(filters, data) {
  const isFilterSet = BEDS_TYPE.find(b => {
    return filters[b.value]
  });
  if (!isFilterSet) {
    return data;
  }
  const filtered = data.filter(h => filters[h.room]);
  return filtered;
}

function prepareChartData(hotels) {
  return hotels.map(h => ({
    rating: +h.rating.average,
    price: +h.price.amount,
    reviews: +h.rating.reviews,
    name: h.title,
  }));
}
const sortHotels = {
  price: (a, b) => a.price.amount - b.price.amount,
  rating: (a, b) => b.rating.average - a.rating.average,
  reviews: (a, b) => b.rating.reviews - a.rating.reviews,
};

function applySort(hotels, sortField) {
  return hotels.sort(sortHotels[sortField]).concat([]);
}

const Layout = ({ children }) => (
  <Grid stackable divided>
    <Grid.Row>{children}</Grid.Row>
  </Grid>
);
const Sidebar = ({ children }) => (
  <Grid.Column width={4}>{children}</Grid.Column>
);

const Feed = ({ children }) => <Grid.Column width={12}>{children}</Grid.Column>;

Layout.Sidebar = Sidebar;
Layout.Feed = Feed;

export default SelectHotel;
