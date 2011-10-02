#!/usr/bin/env ruby

# just concatenate our files
files = %w[intro main dirtyrects sprite group quadtree world viewport tiled-background outro].map { |fn| "#{fn}.js" }
bodies = "bodies.js"
File.open(bodies, "w") do |f|
  files.each { |fn| f.write(File.read(fn)) }
end
