const pkg = require("../package.json");

const prefix = `/*
Copyright (c) 2017 ${pkg.author.name}
${pkg.name} project is licensed under the ${pkg.license} license
${pkg.name} JavaScript library
${pkg.homepage}
@version ${process.env.NIGHTLY || pkg.version}
`;
const pkgd = `${prefix}
All-in-one packaged file for ease use of '${pkg.name}' with below dependencies.
- ${Object.entries(pkg.dependencies).map(v => v.join(" ")).join(", ")}
*/`;

exports.banner = `${prefix}*/`;
exports.pkgd = pkgd;
