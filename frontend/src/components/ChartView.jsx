import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = [
  "#6366f1", "#22d3ee", "#a78bfa", "#34d399",
  "#fbbf24", "#f472b6", "#60a5fa", "#fb923c",
];

const AXIS_PROPS = {
  stroke: "#8b93b8",
  fontSize: 12,
  tickLine: false,
  axisLine: { stroke: "#2b3253" },
};

const GRID_PROPS = { strokeDasharray: "3 3", stroke: "#2b3253" };

const TOOLTIP_STYLE = {
  background: "#161a2e",
  border: "1px solid #2b3253",
  borderRadius: 8,
  color: "#e8ebf7",
  fontSize: 13,
};

export default function ChartView({ chart, columns, rows }) {
  if (!chart || !rows?.length) return null;
  const { type, x, y, title } = chart;

  if (!x || !columns.includes(x)) return null;

  if (type === "pie") {
    const numericRows = rows
      .filter((r) => r[x] !== null && r[x] !== undefined)
      .map((r) => ({ ...r, [y]: Number(r[y]) || 0 }));
    if (!numericRows.length) return null;
    return (
      <figure className="chart-box">
        {title && <figcaption className="chart-title">{title}</figcaption>}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={numericRows}
              dataKey={y}
              nameKey={x}
              innerRadius={55}
              outerRadius={100}
              paddingAngle={2}
            >
              {numericRows.map((entry, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </figure>
    );
  }

  if (!y || !columns.includes(y)) return null;

  const data = rows.map((r) => ({
    ...r,
    [y]: typeof r[y] === "number" ? r[y] : Number(r[y]) || 0,
  }));
  const margin = { top: 8, right: 16, bottom: 8, left: 0 };

  const axes = (
    <>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis dataKey={x} {...AXIS_PROPS} />
      <YAxis {...AXIS_PROPS} width={48} />
      <Tooltip contentStyle={TOOLTIP_STYLE} />
      <Legend />
    </>
  );

  return (
    <figure className="chart-box">
      {title && <figcaption className="chart-title">{title}</figcaption>}
      <ResponsiveContainer width="100%" height={300}>
        {type === "line" ? (
          <LineChart data={data} margin={margin}>
            {axes}
            <Line type="monotone" dataKey={y} stroke={PALETTE[0]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : type === "area" ? (
          <AreaChart data={data} margin={margin}>
            {axes}
            <Area type="monotone" dataKey={y} stroke={PALETTE[0]} fill={PALETTE[0]} fillOpacity={0.25} />
          </AreaChart>
        ) : type === "scatter" ? (
          <ScatterChart data={data} margin={margin}>
            {axes}
            <Scatter dataKey={y} fill={PALETTE[2]} />
          </ScatterChart>
        ) : (
          <BarChart data={data} margin={margin}>
            {axes}
            <Bar dataKey={y} fill={PALETTE[0]} radius={[6, 6, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </figure>
  );
}
