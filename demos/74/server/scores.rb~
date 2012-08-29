require "sinatra"
require "redis"
require "fileutils"
require "digest"
require "json"
require "yaml"
require "date"

configure do
  CONFIG = YAML.load File.read(File.join(File.dirname(__FILE__), "config.yaml"))
end

before do
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Content-Type"] = "application/json"
end

get "/replay" do
  path = File.join CONFIG[:replay_dir], redis.hget("score:#{params[:key]}", "replay_filepath")
  send_file path, :type => "application/json"
end

get "/scores" do
  scores = nil
  mode = "Normal"
  page = (params[:page] || 1).to_i - 1
  per_page = params[:per_page].to_i || 10
  per_page = 10 if per_page > 100
  index = page * per_page

  ids = redis.zrevrange "sorted_scores:#{mode}", index, index + per_page

  redis.pipelined do
    scores = ids.collect do |id|
      [id, redis.hgetall("score:#{id}")]
    end
  end

  scores.collect do |s|
    score = s.last.value
    score.delete "replay_filepath"
    score[:key] = s.first
    score
  end.to_json
end

get "/dailybest" do
  score = nil
  mode = "Normal"

  id = redis.zrevrange("daily_sorted_scores:#{mode}:#{today_str}", 0, 0)

  if id.empty?
    return score.to_json
  end

  id = id.first
  score = redis.hgetall "score:#{id}"
  score.delete "replay_filepath"
  score[:key] = id
  score.to_json
end

post "/score" do
  hash = Digest::SHA2.hexdigest params[:replay]
  date = (Time.now.to_f * 1000).to_i
  score = params[:score]
  mode = params[:mode]

  if params[:replay].empty? || !redis.sadd("scores", hash)
    return
  end

  id = redis.incr "score_ids"

  redis.hmset "score:#{id}",
    "score", score,
     "elapsed", params[:elapsed],
     "player", params[:player],
     "mode", mode,
     "replay_filepath", save_replay(params[:replay], hash),
     "date", date

  redis.zadd "daily_sorted_scores:#{mode}:#{today_str}", score, id
  redis.zadd "sorted_scores:#{mode}", score, id
end

def today_str
  Date.today.strftime "%Y%m%d"
end

def save_replay replay, file_name
  directory = File.join random_number, random_number
  FileUtils.mkdir_p File.join(CONFIG[:replay_dir], directory)
  full_path = File.join directory, file_name

  File.open File.join(CONFIG[:replay_dir], full_path), "w:UTF-8" do |f|
    f.write replay
  end

  full_path
end

def random_number
  sprintf "%02d", rand() * 100
end

def redis
  @redis = Redis.new unless @redis
  @redis
end
