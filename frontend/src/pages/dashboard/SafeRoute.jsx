import { useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Crosshair,
  Map,
  MapPin,
  Navigation,
  Route,
  Shield,
  Star,
  Users,
} from "lucide-react";

import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import Card from "../../components/common/Card";

const routes = [
  {
    id: 1,
    name: "Safest Route",
    distance: "4.8 km",
    time: "16 min",
    safety: 96,
    traffic: "Low",
    description:
      "Well-lit roads with high pedestrian activity.",
  },
  {
    id: 2,
    name: "Balanced Route",
    distance: "4.2 km",
    time: "13 min",
    safety: 88,
    traffic: "Moderate",
    description:
      "Good balance between travel time and safety.",
  },
  {
    id: 3,
    name: "Fastest Route",
    distance: "3.7 km",
    time: "10 min",
    safety: 71,
    traffic: "High",
    description:
      "Fastest option but contains lower-safety areas.",
  },
];

export default function SafeRoute() {
  const [destination, setDestination] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  const [selectedRoute, setSelectedRoute] =
    useState(1);

  const searchRoute = (event) => {
    event.preventDefault();

    if (!destination.trim()) return;

    setSearched(true);
  };

  return (
    <div className="dashboard-layout">
      <Header />

      <Sidebar />

      <main className="dashboard-main">
        <div className="dashboard-content">

          <div className="page-title-row">
            <div>
              <span className="eyebrow">
                PERSONAL SAFETY
              </span>

              <h1>Safe Route Planner</h1>

              <p>
                Find routes optimized for safety,
                lighting and trusted areas.
              </p>
            </div>

            <div className="route-protected">
              <Shield size={16} />
              Safety mode ON
            </div>
          </div>

          {/* Search */}

          <Card className="route-search-card">
            <form
              className="route-search"
              onSubmit={searchRoute}
            >
              <div className="route-input">
                <MapPin size={19} />

                <input
                  value={destination}
                  onChange={(event) =>
                    setDestination(
                      event.target.value
                    )
                  }
                  placeholder="Where do you want to go?"
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
              >
                <Navigation size={17} />
                Find Safe Route
              </button>
            </form>

            <div className="route-options">
              <span>
                <Shield size={13} />
                Safety prioritized
              </span>

              <span>
                <Crosshair size={13} />
                Live location enabled
              </span>

              <span>
                <Users size={13} />
                Trusted areas considered
              </span>
            </div>
          </Card>

          <div className="route-layout">

            {/* Map */}

            <Card className="route-map-card">
              <div className="route-map">

                <div className="map-grid" />

                <div className="map-road road-one" />
                <div className="map-road road-two" />
                <div className="map-road road-three" />
                <div className="map-road road-four" />

                <div className="map-current">
                  <div />
                  <span>You</span>
                </div>

                {searched && (
                  <div className="map-destination">
                    <MapPin size={25} />
                    <span>
                      Destination
                    </span>
                  </div>
                )}

                <div className="map-label label-one">
                  Safe Zone
                </div>

                <div className="map-label label-two">
                  Well Lit
                </div>

                <div className="map-label danger-zone">
                  Caution Area
                </div>

                <div className="map-controls">
                  <button>
                    <PlusIcon />
                  </button>

                  <button>
                    <MinusIcon />
                  </button>

                  <button>
                    <Crosshair size={16} />
                  </button>
                </div>

              </div>

              <div className="map-footer">
                <Map size={16} />

                <span>
                  Safety map data • Updated recently
                </span>

                <span className="map-live">
                  LIVE
                </span>
              </div>
            </Card>

            {/* Routes */}

            <div className="route-results">

              <div className="route-results-header">
                <div>
                  <span className="eyebrow">
                    ROUTE OPTIONS
                  </span>

                  <h2>
                    {searched
                      ? "Routes to your destination"
                      : "Recommended routes"}
                  </h2>
                </div>
              </div>

              {routes.map((route) => (
                <button
                  key={route.id}
                  className={`route-option ${
                    selectedRoute === route.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedRoute(route.id)
                  }
                >
                  <div className="route-option-top">
                    <div className="route-icon">
                      <Route size={18} />
                    </div>

                    <div className="route-name">
                      <strong>
                        {route.name}
                      </strong>

                      <span>
                        {route.description}
                      </span>
                    </div>

                    <div className="route-score">
                      <strong>
                        {route.safety}%
                      </strong>

                      <span>
                        Safety
                      </span>
                    </div>
                  </div>

                  <div className="route-details">
                    <span>
                      <Navigation size={13} />
                      {route.distance}
                    </span>

                    <span>
                      <Clock3 size={13} />
                      {route.time}
                    </span>

                    <span>
                      <AlertTriangle size={13} />
                      {route.traffic} traffic
                    </span>
                  </div>
                </button>
              ))}

              <Card className="route-recommendation">
                <div className="recommendation-icon">
                  <Star size={18} />
                </div>

                <div>
                  <strong>
                    Recommended for safety
                  </strong>

                  <span>
                    The safest route prioritizes
                    well-lit roads and trusted zones
                    over travel time.
                  </span>
                </div>
              </Card>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function PlusIcon() {
  return (
    <span className="map-plus">
      +
    </span>
  );
}

function MinusIcon() {
  return (
    <span className="map-minus">
      −
    </span>
  );
}