#!/usr/bin/env ruby

# just concatenate our files
files = %w[intro main sprite quadtree world viewport outro].map { |fn| "#{fn}.js" }
bodies = "bodies.js"
File.open(bodies, "w") do |f|
  files.each { |fn| f.write(File.read(fn)) }
end
